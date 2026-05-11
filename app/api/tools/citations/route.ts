import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { proGateApi } from "@/lib/require-pro";
import { directoriesForTrade } from "@/lib/tools/citation-directories";

/**
 * POST /api/tools/citations
 *
 * Body: { auditId: string, services?: string[], phone?: string, address?: string, website?: string }
 *
 * Returns:
 *  {
 *    nap: { businessName, phone, address, website, city, trade },
 *    descriptions: { short, medium, long }, // 80, 250, 500 chars
 *    directories: [...filtered to relevant trade]
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
    website?: string;
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
  const websiteOverride =
    typeof body.website === "string" ? body.website.trim() : "";

  const db = getSupabase();
  const { data: audit, error: auditErr } = await db
    .from("audits")
    .select("id, business_name, trade, city, user_id, input")
    .eq("id", auditId)
    .single();
  if (auditErr || !audit || audit.user_id !== user.id) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  const inputObj =
    audit.input && typeof audit.input === "object"
      ? (audit.input as { websiteUrl?: string })
      : null;
  const website = websiteOverride || inputObj?.websiteUrl || "";

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
    services,
  });

  let descriptions: { short: string; medium: string; long: string } | null =
    null;
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
          "You are a local-SEO copywriter for small contractors. You write business descriptions for citation directories. You always put the trade and city in the first 80 characters. You ban marketing fluff ('leading', 'premier', 'committed to excellence', 'industry-leading', 'one-stop shop', 'top-rated'). 8th-grade reading level. You return only valid JSON when asked.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1400,
        temperature: 0.5,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        content: AnthropicContentBlock[];
      };
      const textBlock = data.content.filter((b) => b.type === "text").pop();
      if (textBlock?.text) descriptions = parseDescriptions(textBlock.text);
    } else {
      console.error("Anthropic error:", response.status, await response.text());
    }
  } catch (err) {
    console.error("Citations generation error:", err);
  }

  if (!descriptions) {
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }

  const directories = directoriesForTrade(audit.trade);

  return NextResponse.json({
    nap: {
      businessName: audit.business_name,
      phone,
      address,
      website,
      city: audit.city,
      trade: audit.trade,
    },
    descriptions,
    directories,
  });
}

function buildPrompt(args: {
  business: string;
  trade: string;
  city: string;
  services: string[];
}): string {
  const servicesLine = args.services.length
    ? `Services: ${args.services.join(", ")}.`
    : "Services: not provided — use 3-5 typical services for the trade.";

  return `Write three business descriptions for citation directory listings (Yelp, BBB, Apple Maps Connect, etc.).

<business>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}
${servicesLine}
</business>

Each description must:
- Put the trade and city in the first 80 characters.
- Name 2-3 specific services (no vague phrases).
- Read naturally, 8th-grade reading level.
- No marketing fluff. No emoji. No all-caps. No exclamation points.
- Not invent facts (no years in business, no licenses, no awards).

Return three lengths:

1. **short** — ≤ 80 characters. One-liner for tight directories like Foursquare or Facebook short bios.
2. **medium** — 200-250 characters. Standard directory length (Manta, MerchantCircle, YellowPages).
3. **long** — 450-500 characters. Long-form directories (Yelp, BBB, Nextdoor) plus a soft CTA at the end.

Return ONLY valid JSON in this exact shape:

{
  "short": "...",
  "medium": "...",
  "long": "..."
}`;
}

function parseDescriptions(
  text: string,
): { short: string; medium: string; long: string } | null {
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
  const short = typeof obj.short === "string" ? obj.short.trim() : "";
  const medium = typeof obj.medium === "string" ? obj.medium.trim() : "";
  const long = typeof obj.long === "string" ? obj.long.trim() : "";
  if (!short || !medium || !long) return null;
  return { short, medium, long };
}
