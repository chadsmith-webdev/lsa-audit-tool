import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";

/**
 * POST /api/tools/backlinks
 *
 * Body: { auditId: string }
 *
 * Returns:
 *  {
 *    business: { name, trade, city, website },
 *    prospects: Array<{ category, why, examples: string[], pitch: string }>,
 *    templates: Array<{ angle, subject, body }>
 *  }
 */

type AnthropicContentBlock = { type: string; text?: string };

type Prospect = {
  category: string;
  why: string;
  examples: string[];
  pitch: string;
};

type Template = {
  angle: string;
  subject: string;
  body: string;
};

type ParsedPayload = {
  prospects: Prospect[];
  templates: Template[];
};

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { auditId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const auditId = typeof body.auditId === "string" ? body.auditId : null;
  if (!auditId) {
    return NextResponse.json({ error: "auditId required" }, { status: 400 });
  }

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
  const website = inputObj?.websiteUrl ?? "";

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
    website,
  });

  let parsed: ParsedPayload | null = null;
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
          "You are a local-SEO link builder for small contractors. You recommend realistic, ethical, trade-relevant link sources — no PBNs, no link buying, no spammy directories. You write outreach emails that sound like a real local business owner, not a marketing agency. No fluff phrases ('leading', 'premier', 'committed to excellence', 'industry-leading', 'one-stop shop', 'top-rated', 'cutting-edge'). 8th-grade reading level. You return only valid JSON when asked.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2600,
        temperature: 0.6,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        content: AnthropicContentBlock[];
      };
      const textBlock = data.content.filter((b) => b.type === "text").pop();
      if (textBlock?.text) parsed = parsePayload(textBlock.text);
    } else {
      console.error("Anthropic error:", response.status, await response.text());
    }
  } catch (err) {
    console.error("Backlinks generation error:", err);
  }

  if (!parsed) {
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }

  return NextResponse.json({
    business: {
      name: audit.business_name,
      trade: audit.trade,
      city: audit.city,
      website,
    },
    prospects: parsed.prospects,
    templates: parsed.templates,
  });
}

function buildPrompt(args: {
  business: string;
  trade: string;
  city: string;
  website: string;
}): string {
  return `Plan a backlink outreach campaign for this local contractor.

<business>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}
Website: ${args.website || "(not provided)"}
</business>

Produce two things:

## 1. Prospects (6 categories)

Six categories of link sources that make sense for a ${args.trade} business in ${args.city}. For each category give:
- "category" — short label (e.g., "Local Chamber of Commerce")
- "why" — one sentence on why this type of site links to local contractors
- "examples" — 2-3 specific, plausible names or site types they should search for in ${args.city} (be specific to the city/region when possible — e.g., for Fayetteville AR mention NWA Chamber, etc.). Don't invent URLs.
- "pitch" — one sentence describing the angle to use when reaching out

Mix categories: chambers, trade associations, supplier/manufacturer partner pages, local news/community blogs, local sponsorships (sports teams, charities), and one creative category specific to the trade.

## 2. Templates (3 outreach emails)

Three short outreach email templates (each 80-120 words) using different angles:
- angle "partnership" — offering a mutual referral or partnership
- angle "sponsor" — offering to sponsor an event, team, or cause in exchange for a listing
- angle "expert-quote" — offering a quote or insight for a local article or resource page

Each template must:
- Sound like a real local business owner wrote it, not an agency
- Use [first name] and [their org/site] as placeholders where appropriate
- Include the business name "${args.business}" and city "${args.city}" naturally
- End with a soft, specific ask — not "let me know if interested"
- No marketing fluff. No emoji.

Return ONLY valid JSON in this exact shape:

{
  "prospects": [
    {
      "category": "...",
      "why": "...",
      "examples": ["...", "..."],
      "pitch": "..."
    }
  ],
  "templates": [
    {
      "angle": "partnership",
      "subject": "...",
      "body": "..."
    },
    {
      "angle": "sponsor",
      "subject": "...",
      "body": "..."
    },
    {
      "angle": "expert-quote",
      "subject": "...",
      "body": "..."
    }
  ]
}`;
}

function parsePayload(text: string): ParsedPayload | null {
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
  const rawProspects = Array.isArray(obj.prospects) ? obj.prospects : [];
  const rawTemplates = Array.isArray(obj.templates) ? obj.templates : [];

  const prospects: Prospect[] = rawProspects
    .map((p): Prospect | null => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const category = typeof o.category === "string" ? o.category : "";
      const why = typeof o.why === "string" ? o.why : "";
      const pitch = typeof o.pitch === "string" ? o.pitch : "";
      const examples = Array.isArray(o.examples)
        ? o.examples.filter((x): x is string => typeof x === "string")
        : [];
      if (!category || !why || !pitch) return null;
      return { category, why, examples, pitch };
    })
    .filter((x): x is Prospect => x !== null);

  const templates: Template[] = rawTemplates
    .map((t): Template | null => {
      if (!t || typeof t !== "object") return null;
      const o = t as Record<string, unknown>;
      const angle = typeof o.angle === "string" ? o.angle : "";
      const subject = typeof o.subject === "string" ? o.subject : "";
      const tBody = typeof o.body === "string" ? o.body : "";
      if (!angle || !subject || !tBody) return null;
      return { angle, subject, body: tBody };
    })
    .filter((x): x is Template => x !== null);

  if (!prospects.length || !templates.length) return null;
  return { prospects, templates };
}
