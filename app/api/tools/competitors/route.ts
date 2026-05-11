import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { proGateApi } from "@/lib/require-pro";

/**
 * POST /api/tools/competitors
 *
 * Body: { auditId: string }
 *
 * Pulls competitor_names from the stored audit and asks Claude to build a
 * competitive intelligence brief — likely strengths, likely weaknesses,
 * and a specific way to win against each one.
 */

type AnthropicContentBlock = { type: string; text?: string };

type CompetitorBrief = {
  name: string;
  likely_strengths: string[];
  likely_weaknesses: string[];
  how_to_beat: string;
};

type ParsedPayload = {
  competitors: CompetitorBrief[];
  overall_strategy: string;
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
  const gate = await proGateApi(user.id);
  if (gate) return gate;

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
    .select(
      "id, business_name, trade, city, user_id, result, gbp_rating, gbp_review_count",
    )
    .eq("id", auditId)
    .single();
  if (auditErr || !audit || audit.user_id !== user.id) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Extract competitor names from stored audit result
  const result =
    audit.result && typeof audit.result === "object"
      ? (audit.result as { competitor_names?: unknown })
      : null;
  const rawCompetitors = Array.isArray(result?.competitor_names)
    ? result!.competitor_names
    : [];
  const competitorNames: string[] = rawCompetitors
    .filter((c): c is string => typeof c === "string")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (competitorNames.length === 0) {
    return NextResponse.json(
      {
        error:
          "No competitors found in this audit. Re-run an audit to refresh the competitor list.",
      },
      { status: 400 },
    );
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
    rating: audit.gbp_rating,
    reviewCount: audit.gbp_review_count,
    competitors: competitorNames,
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
          "You are a competitive intelligence analyst for local contractors. You analyze competitors based on what's typical for businesses of similar names, sizes, and trades in their market. You are honest about what you can and can't infer from a name alone — you mark guesses as 'likely'. No fluff phrases. 8th-grade reading level. You return only valid JSON.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2500,
        temperature: 0.5,
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
    console.error("Competitor watch error:", err);
  }

  if (!parsed) {
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }

  return NextResponse.json({
    business: {
      name: audit.business_name,
      trade: audit.trade,
      city: audit.city,
      rating: audit.gbp_rating,
      reviewCount: audit.gbp_review_count,
    },
    competitors: parsed.competitors,
    overall_strategy: parsed.overall_strategy,
  });
}

function buildPrompt(args: {
  business: string;
  trade: string;
  city: string;
  rating: number | null;
  reviewCount: number | null;
  competitors: string[];
}): string {
  const yourSignals: string[] = [];
  if (args.rating !== null && args.rating !== undefined) {
    yourSignals.push(`GBP rating: ${args.rating}`);
  }
  if (args.reviewCount !== null && args.reviewCount !== undefined) {
    yourSignals.push(`GBP reviews: ${args.reviewCount}`);
  }
  const yourLine = yourSignals.length
    ? `\nYour signals: ${yourSignals.join(", ")}.`
    : "";

  return `Analyze the local competitive landscape for this contractor.

<you>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}${yourLine}
</you>

<competitors-ranking-near-you>
${args.competitors.map((c, i) => `${i + 1}. ${c}`).join("\n")}
</competitors-ranking-near-you>

For each competitor, provide:
- "name" — the competitor's exact name
- "likely_strengths" — 2-3 things they probably do well based on their name + visibility in this market. Use phrases like "likely" or "probably". Be specific (e.g., "Long-tenured local brand, probably strong word-of-mouth referrals" not "Good reputation").
- "likely_weaknesses" — 2-3 things they probably don't do well. Common gaps: weak GBP profile, no recent photos, slow website, no schema, generic content. Be honest if you can't tell — say "Hard to assess without visiting the site."
- "how_to_beat" — one specific action ${args.business} can take to win against this competitor in search. Concrete tactic, not generic advice.

Then write "overall_strategy": a 2-3 sentence overall positioning play that differentiates ${args.business} from the pack.

Return ONLY valid JSON in this shape:

{
  "competitors": [
    {
      "name": "...",
      "likely_strengths": ["...", "..."],
      "likely_weaknesses": ["...", "..."],
      "how_to_beat": "..."
    }
  ],
  "overall_strategy": "..."
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
  const rawList = Array.isArray(obj.competitors) ? obj.competitors : [];
  const overall =
    typeof obj.overall_strategy === "string" ? obj.overall_strategy : "";
  const competitors: CompetitorBrief[] = rawList
    .map((c): CompetitorBrief | null => {
      if (!c || typeof c !== "object") return null;
      const o = c as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : "";
      const strengths = Array.isArray(o.likely_strengths)
        ? o.likely_strengths.filter((x): x is string => typeof x === "string")
        : [];
      const weaknesses = Array.isArray(o.likely_weaknesses)
        ? o.likely_weaknesses.filter((x): x is string => typeof x === "string")
        : [];
      const beat = typeof o.how_to_beat === "string" ? o.how_to_beat : "";
      if (!name || !beat) return null;
      return {
        name,
        likely_strengths: strengths,
        likely_weaknesses: weaknesses,
        how_to_beat: beat,
      };
    })
    .filter((x): x is CompetitorBrief => x !== null);
  if (!competitors.length || !overall) return null;
  return { competitors, overall_strategy: overall };
}
