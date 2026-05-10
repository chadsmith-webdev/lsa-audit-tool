import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { fetchWebsiteData } from "@/lib/prefetch/website";

/**
 * POST /api/tools/onpage
 *
 * Body: { auditId: string, url?: string, tone?: "professional"|"friendly"|"premium" }
 *
 * Re-fetches the page's title/meta/H1 (if a URL is provided or available on
 * the audit), then asks Claude for 3 optimized variants of each.
 *
 * Returns:
 *  {
 *    current: { url, title, metaDescription, h1, fetchError? },
 *    suggestions: {
 *      titles: [{ text, length, rationale }],
 *      metas:  [{ text, length, rationale }],
 *      h1s:    [{ text, length, rationale }]
 *    }
 *  }
 */

const TITLE_MAX = 60;
const META_MAX = 160;
const H1_MAX = 70;

const ALLOWED_TONES = ["professional", "friendly", "premium"] as const;
type Tone = (typeof ALLOWED_TONES)[number];

function isTone(v: unknown): v is Tone {
  return (
    typeof v === "string" && (ALLOWED_TONES as readonly string[]).includes(v)
  );
}

type Suggestion = { text: string; length: number; rationale: string };

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

  let body: { auditId?: string; url?: string; tone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const auditId = typeof body.auditId === "string" ? body.auditId : null;
  if (!auditId) {
    return NextResponse.json({ error: "auditId required" }, { status: 400 });
  }
  const tone: Tone = isTone(body.tone) ? body.tone : "professional";

  const db = getSupabase();
  const { data: audit, error: auditErr } = await db
    .from("audits")
    .select("id, business_name, trade, city, user_id, input")
    .eq("id", auditId)
    .single();
  if (auditErr || !audit || audit.user_id !== user.id) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Resolve target URL: explicit param wins, else audit's websiteUrl.
  const inputObj =
    audit.input && typeof audit.input === "object"
      ? (audit.input as { websiteUrl?: string })
      : null;
  const explicitUrl = typeof body.url === "string" ? body.url.trim() : "";
  const url = explicitUrl || inputObj?.websiteUrl || "";

  if (!url) {
    return NextResponse.json(
      {
        error:
          "No website on file for this audit. Re-run the audit with a website URL or pass one in the request.",
      },
      { status: 400 },
    );
  }

  // Fetch current page
  const site = await fetchWebsiteData(url);

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
    tone,
    currentTitle: site.title ?? "",
    currentMeta: site.metaDescription ?? "",
    currentH1: site.h1 ?? "",
    fetchError: site.fetchError ?? null,
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
          "You are a senior local SEO copywriter for small contractors. You write title tags, meta descriptions, and H1s that earn clicks AND rank. You always put the primary keyword + city in the first 35 characters of titles. You write metas that read like benefit-led ad copy with a soft CTA. You ban marketing fluff ('leading provider', 'premier', 'committed to excellence', 'industry-leading', 'one-stop shop', 'top-rated'). You write at an 8th-grade reading level. You return only valid JSON when asked.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2200,
        temperature: 0.6,
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

    const parsed = parseSuggestions(textBlock.text);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse response" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      current: {
        url,
        title: site.title ?? null,
        metaDescription: site.metaDescription ?? null,
        h1: site.h1 ?? null,
        fetchError: site.fetchError ?? null,
      },
      suggestions: parsed,
    });
  } catch (err) {
    console.error("On-page generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function buildPrompt(args: {
  business: string;
  trade: string;
  city: string;
  tone: Tone;
  currentTitle: string;
  currentMeta: string;
  currentH1: string;
  fetchError: string | null;
}): string {
  const toneGuide: Record<Tone, string> = {
    professional: "Plainspoken and confident. No exclamation points.",
    friendly: "Warm and approachable. Contractions OK. Never cute.",
    premium: "Quietly upscale. Emphasize craft and care. No bragging.",
  };

  const currentBlock = args.fetchError
    ? `\n<fetch_note>Could not fetch the live page (${args.fetchError}). Generate fresh suggestions from scratch.</fetch_note>\n`
    : `\n<current>\nTitle: ${args.currentTitle || "(missing)"}\nMeta: ${args.currentMeta || "(missing)"}\nH1: ${args.currentH1 || "(missing)"}\n</current>\n`;

  return `Optimize the on-page SEO for this local contractor's website.

<business>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}
</business>
${currentBlock}
<tone>
${toneGuide[args.tone]}
</tone>

<rules>
- Titles ≤ ${TITLE_MAX} characters. Trade + city in the first 35 characters.
- Meta descriptions ≤ ${META_MAX} characters. Lead with the benefit, end with a soft CTA.
- H1s ≤ ${H1_MAX} characters. Match the title's primary keyword but rephrase naturally.
- No marketing fluff. No emoji. No all-caps. No exclamation points.
- 8th-grade reading level.
</rules>

Give 3 variants for each element. For every variant include a one-sentence rationale (why this beats the current).

Return ONLY valid JSON in this exact shape:

{
  "titles": [
    { "text": "...", "rationale": "..." },
    { "text": "...", "rationale": "..." },
    { "text": "...", "rationale": "..." }
  ],
  "metas": [
    { "text": "...", "rationale": "..." },
    { "text": "...", "rationale": "..." },
    { "text": "...", "rationale": "..." }
  ],
  "h1s": [
    { "text": "...", "rationale": "..." },
    { "text": "...", "rationale": "..." },
    { "text": "...", "rationale": "..." }
  ]
}`;
}

function parseSuggestions(text: string): {
  titles: Suggestion[];
  metas: Suggestion[];
  h1s: Suggestion[];
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

  const titles = toSuggestions(obj.titles);
  const metas = toSuggestions(obj.metas);
  const h1s = toSuggestions(obj.h1s);
  if (!titles.length || !metas.length || !h1s.length) return null;
  return { titles, metas, h1s };
}

function toSuggestions(raw: unknown): Suggestion[] {
  if (!Array.isArray(raw)) return [];
  const out: Suggestion[] = [];
  for (const item of raw) {
    if (item && typeof item === "object") {
      const text = (item as { text?: unknown }).text;
      const rationale = (item as { rationale?: unknown }).rationale;
      if (typeof text === "string" && typeof rationale === "string") {
        const t = text.trim();
        out.push({ text: t, length: t.length, rationale: rationale.trim() });
      }
    }
  }
  return out;
}
