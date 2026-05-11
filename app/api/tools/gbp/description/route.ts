import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { proGateApi } from "@/lib/require-pro";

/**
 * POST /api/tools/gbp/description
 *
 * Body: { auditId: string, current?: string, tone?: "professional"|"friendly"|"premium" }
 * Returns: { variants: [{ label, length, text }] } (3 variants)
 *
 * v2 of GBP Optimizer — generates Google Business Profile description rewrites.
 * GBP allows up to 750 characters. We return three lengths so the user can pick
 * the one that matches how much their audience reads.
 */

type Variant = { label: string; length: number; text: string };

const MAX_CURRENT = 1500; // truncate user-pasted descriptions defensively
const ALLOWED_TONES = ["professional", "friendly", "premium"] as const;
type Tone = (typeof ALLOWED_TONES)[number];

function isTone(value: unknown): value is Tone {
  return (
    typeof value === "string" &&
    (ALLOWED_TONES as readonly string[]).includes(value)
  );
}

export async function POST(req: Request) {
  // Auth gate
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

  let body: { auditId?: string; current?: string; tone?: string };
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
  const current =
    typeof body.current === "string"
      ? body.current.trim().slice(0, MAX_CURRENT)
      : "";

  // Verify the audit belongs to this user, and pull the basics.
  const db = getSupabase();
  const { data: audit, error: auditErr } = await db
    .from("audits")
    .select("id, business_name, trade, city, user_id")
    .eq("id", auditId)
    .single();

  if (auditErr || !audit || audit.user_id !== user.id) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

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
    current,
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
          "You are a senior local SEO copywriter who writes Google Business Profile descriptions for small contractors. You write plain, concrete prose. You avoid marketing fluff (no 'leading provider', 'committed to excellence', 'industry-leading', 'cutting-edge'). You name specific services and the city. You write at an 8th-grade reading level. You always return only valid JSON when asked.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Anthropic error:", response.status, details);
      return NextResponse.json({ error: "Generation failed" }, { status: 502 });
    }

    const data = await response.json();
    const textBlock = (data.content as Array<{ type: string; text?: string }>)
      .filter((b) => b.type === "text")
      .pop();
    if (!textBlock?.text) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    const variants = parseVariants(textBlock.text);
    if (!variants) {
      return NextResponse.json(
        { error: "Could not parse response" },
        { status: 502 },
      );
    }

    return NextResponse.json({ variants });
  } catch (err) {
    console.error("Description rewrite error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function buildPrompt(args: {
  business: string;
  trade: string;
  city: string;
  tone: Tone;
  current: string;
}): string {
  const toneGuide: Record<Tone, string> = {
    professional:
      "Plainspoken, confident, no exclamation points. Reads like a trusted contractor talking to a homeowner.",
    friendly:
      "Warm and approachable, contractions OK, one or two friendly turns of phrase, but never cute.",
    premium:
      "Quietly confident. Emphasize craftsmanship, attention to detail, longer client relationships. No bragging.",
  };

  const toneInstruction = toneGuide[args.tone];

  const currentBlock = args.current
    ? `\n<current_description>\n${args.current}\n</current_description>\n\nUse the current description as raw material — keep specific facts (years in business, certifications, named services) but rewrite for tone, structure, and length.`
    : `\nThe business has no description on file yet. Write from scratch using only the business name, trade, and city. Do not invent facts (no specific years in business, certifications, or family ownership claims).`;

  return `Write three Google Business Profile description variants for this business.

<business>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}
</business>
${currentBlock}

<tone>
${toneInstruction}
</tone>

<rules>
- The trade and city must appear in the first 100 characters of every variant (Google indexes the start most heavily).
- Name specific services that are typical for the trade, not vague phrases like "all your needs".
- No marketing fluff: ban "leading", "premier", "committed to excellence", "industry-leading", "cutting-edge", "one-stop shop".
- No emoji, no all-caps, no exclamation points.
- 8th-grade reading level. Short sentences are fine.
- Each variant must respect Google's 750-character hard limit.
</rules>

Return three variants:

1. **Concise** (200-280 characters): Just the trade, city, and 2-3 named services.
2. **Standard** (440-540 characters): Concise plus what makes them different and one trust signal (licensed, insured, locally owned, etc., only if implied by the trade).
3. **Full** (680-740 characters): Standard plus more named services and a clear call to action ("Call for a free estimate" or similar).

Return ONLY valid JSON in this exact shape, nothing else:

{
  "variants": [
    { "label": "Concise", "text": "..." },
    { "label": "Standard", "text": "..." },
    { "label": "Full", "text": "..." }
  ]
}`;
}

function parseVariants(text: string): Variant[] | null {
  // Strip code fences if Claude wrapped the JSON
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to find a JSON object inside the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { variants?: unknown }).variants)
  ) {
    return null;
  }

  const raw = (parsed as { variants: unknown[] }).variants;
  const variants: Variant[] = [];
  for (const v of raw) {
    if (
      v &&
      typeof v === "object" &&
      typeof (v as { label?: unknown }).label === "string" &&
      typeof (v as { text?: unknown }).text === "string"
    ) {
      const text = (v as { text: string }).text.trim();
      variants.push({
        label: (v as { label: string }).label,
        length: text.length,
        text,
      });
    }
  }

  if (variants.length === 0) return null;
  return variants;
}
