import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { proGateApi } from "@/lib/require-pro";

/**
 * POST /api/tools/ai-citability
 *
 * Body: { auditId: string, services?: string[], phone?: string, address?: string }
 *
 * Returns:
 *  {
 *    schema: string,            // pretty-printed JSON-LD LocalBusiness block
 *    faqSchema: string,         // pretty-printed JSON-LD FAQPage block
 *    faqs: [{ q, a }],          // raw FAQ pairs for visible HTML
 *    entityBio: string,         // 2-3 sentence quotable "About" paragraph
 *    quotables: string[]        // 4-6 standalone facts AI can cite
 *  }
 */

type AnthropicContentBlock = { type: string; text?: string };

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const gate = await proGateApi(user.id);
  if (gate) return gate;

  let body: {
    auditId?: string;
    services?: string[];
    phone?: string;
    address?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const auditId = typeof body.auditId === "string" ? body.auditId : null;
  if (!auditId) {
    return NextResponse.json({ error: "auditId required" }, { status: 400 });
  }

  const services = Array.isArray(body.services)
    ? body.services
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";

  const db = getSupabase();
  const { data: audit, error: auditErr } = await db
    .from("audits")
    .select(
      "id, business_name, trade, city, user_id, input, gbp_rating, gbp_review_count",
    )
    .eq("id", auditId)
    .single();
  if (auditErr || !audit || audit.user_id !== user.id) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  const inputObj =
    audit.input && typeof audit.input === "object"
      ? (audit.input as { websiteUrl?: string })
      : null;
  const websiteUrl = inputObj?.websiteUrl ?? "";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 },
    );
  }

  const prompt = buildPrompt({
    business: audit.business_name,
    trade: audit.trade,
    city: audit.city,
    websiteUrl,
    phone,
    address,
    services,
    gbpRating: audit.gbp_rating ?? null,
    gbpReviewCount: audit.gbp_review_count ?? null,
  });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        system:
          "You are a generative engine optimization (GEO) specialist. You write content that AI assistants (ChatGPT, Perplexity, Google AI Overviews) extract and cite verbatim. You favor short, declarative sentences, entity-rich phrasing, and numeric specifics. You ban marketing fluff ('leading', 'premier', 'committed to excellence', 'industry-leading', 'one-stop shop', 'top-rated'). 8th-grade reading level. You return only valid JSON when asked.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2400,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Anthropic error:", response.status, details);
      return NextResponse.json({ error: "Generation failed" }, { status: 502 });
    }

    const data = (await response.json()) as {
      content: AnthropicContentBlock[];
    };
    const textBlock = data.content.filter((b) => b.type === "text").pop();
    if (!textBlock?.text) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    const parsed = parsePayload(textBlock.text);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse response" },
        { status: 502 },
      );
    }

    // Build schema blocks programmatically — more reliable than asking Claude
    // for valid JSON-LD verbatim.
    const localBusinessSchema = buildLocalBusinessSchema({
      business: audit.business_name,
      trade: audit.trade,
      city: audit.city,
      websiteUrl,
      phone,
      address,
      services,
      description: parsed.entityBio,
      gbpRating: audit.gbp_rating ?? null,
      gbpReviewCount: audit.gbp_review_count ?? null,
    });

    const faqSchema = buildFaqSchema(parsed.faqs);

    return NextResponse.json({
      schema: jsonLdScript(localBusinessSchema),
      faqSchema: jsonLdScript(faqSchema),
      faqs: parsed.faqs,
      entityBio: parsed.entityBio,
      quotables: parsed.quotables,
    });
  } catch (err) {
    console.error("AI Citability generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function buildPrompt(args: {
  business: string;
  trade: string;
  city: string;
  websiteUrl: string;
  phone: string;
  address: string;
  services: string[];
  gbpRating: number | null;
  gbpReviewCount: number | null;
}): string {
  const reviewLine =
    args.gbpRating && args.gbpReviewCount
      ? `Rated ${args.gbpRating} stars across ${args.gbpReviewCount} Google reviews.`
      : "";
  const servicesLine = args.services.length
    ? `Services: ${args.services.join(", ")}.`
    : "Services: not provided — use 4-6 typical services for the trade.";

  return `Write GEO (Generative Engine Optimization) content for this local business so AI assistants cite it correctly.

<business>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}
${args.websiteUrl ? `Website: ${args.websiteUrl}` : ""}
${args.phone ? `Phone: ${args.phone}` : ""}
${args.address ? `Address: ${args.address}` : ""}
${servicesLine}
${reviewLine}
</business>

Generate three things:

1. **entityBio** — a 2-3 sentence "About" paragraph (max 320 characters). Must contain: business name, trade, city, and one specific differentiator (specific service, service area, or response time). Written so an AI can quote it verbatim. No fluff.

2. **faqs** — 6 FAQ pairs targeting the questions homeowners actually ask AI assistants about ${args.trade} in ${args.city}. Mix of:
   - service-specific ("How much does [common service] cost in ${args.city}?")
   - urgency ("Do you offer emergency [trade] service?")
   - service area ("What areas do you serve near ${args.city}?")
   - process ("How do I get a quote?")
   - one trust signal ("Are you licensed and insured?")
   - one local ("How quickly can you get to my home in ${args.city}?")
   Answers must be 1-2 short sentences (max 280 chars), entity-rich (name the business in at least 3 of the 6 answers), and contain specific numbers when plausible.

3. **quotables** — 5 standalone factual statements about the business that AI can pull as one-line citations. Each ≤ 140 characters. Each must mention either the business name, the trade, or the city. No opinions — only verifiable-style facts (service area, hours pattern, response time, services offered, trade specialty).

Return ONLY valid JSON in this exact shape:

{
  "entityBio": "...",
  "faqs": [
    { "q": "...", "a": "..." }
  ],
  "quotables": ["...", "..."]
}`;
}

function parsePayload(text: string): {
  entityBio: string;
  faqs: { q: string; a: string }[];
  quotables: string[];
} | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const entityBio =
    typeof obj.entityBio === "string" ? obj.entityBio.trim() : "";
  if (!entityBio) return null;

  const faqs: { q: string; a: string }[] = [];
  if (Array.isArray(obj.faqs)) {
    for (const item of obj.faqs) {
      if (item && typeof item === "object") {
        const q = (item as { q?: unknown }).q;
        const a = (item as { a?: unknown }).a;
        if (typeof q === "string" && typeof a === "string") {
          faqs.push({ q: q.trim(), a: a.trim() });
        }
      }
    }
  }
  if (!faqs.length) return null;

  const quotables: string[] = [];
  if (Array.isArray(obj.quotables)) {
    for (const q of obj.quotables) {
      if (typeof q === "string" && q.trim()) quotables.push(q.trim());
    }
  }

  return { entityBio, faqs, quotables };
}

function buildLocalBusinessSchema(args: {
  business: string;
  trade: string;
  city: string;
  websiteUrl: string;
  phone: string;
  address: string;
  services: string[];
  description: string;
  gbpRating: number | null;
  gbpReviewCount: number | null;
}): Record<string, unknown> {
  // Map common trade names to schema.org types where possible
  const TYPE_MAP: Record<string, string> = {
    plumbing: "Plumber",
    plumber: "Plumber",
    hvac: "HVACBusiness",
    electrical: "Electrician",
    electrician: "Electrician",
    roofing: "RoofingContractor",
    landscaping: "LandscapingBusiness",
    "general contractor": "GeneralContractor",
  };
  const tradeKey = args.trade.toLowerCase();
  const schemaType =
    Object.keys(TYPE_MAP).find((k) => tradeKey.includes(k)) ?? "";
  const type = schemaType ? TYPE_MAP[schemaType] : "LocalBusiness";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: args.business,
    description: args.description,
    areaServed: { "@type": "City", name: args.city },
  };
  if (args.websiteUrl) schema.url = args.websiteUrl;
  if (args.phone) schema.telephone = args.phone;
  if (args.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: args.address,
      addressLocality: args.city,
    };
  }
  if (args.services.length) {
    schema.makesOffer = args.services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s },
    }));
  }
  if (args.gbpRating && args.gbpReviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: args.gbpRating,
      reviewCount: args.gbpReviewCount,
    };
  }
  return schema;
}

function buildFaqSchema(
  faqs: { q: string; a: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

function jsonLdScript(obj: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}
