import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { proGateApi } from "@/lib/require-pro";

/**
 * POST /api/tools/gbp/posts
 *
 * Body: { auditId: string, theme?: PostTheme }
 * Returns: { posts: [{ type, headline, body, cta, ctaLabel }] }
 *
 * Generates 4 weekly Google Business Profile post drafts. GBP posts are
 * short (300-400 chars works best, hard limit 1500). One month of content.
 */

const POST_THEMES = ["mixed", "offers", "updates", "tips"] as const;
type PostTheme = (typeof POST_THEMES)[number];

const ALLOWED_CTAS = [
  "Call now",
  "Book online",
  "Get offer",
  "Learn more",
  "Sign up",
  "Order online",
] as const;
type CtaLabel = (typeof ALLOWED_CTAS)[number];

type Post = {
  type: "What's New" | "Offer" | "Event" | "Update";
  headline: string;
  body: string;
  ctaLabel: CtaLabel;
};

function isTheme(value: unknown): value is PostTheme {
  return (
    typeof value === "string" &&
    (POST_THEMES as readonly string[]).includes(value)
  );
}

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

  let body: { auditId?: string; theme?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const auditId = typeof body.auditId === "string" ? body.auditId : null;
  if (!auditId) {
    return NextResponse.json({ error: "auditId required" }, { status: 400 });
  }
  const theme: PostTheme = isTheme(body.theme) ? body.theme : "mixed";

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
    theme,
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
          "You are a senior local marketing copywriter who writes Google Business Profile posts for small contractors. You write plain, concrete prose that sounds like a person, not a brand. You name specific services and the city. You avoid marketing fluff (no 'leading', 'premier', 'committed to excellence', 'industry-leading', 'cutting-edge'). You always return only valid JSON when asked.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
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

    const posts = parsePosts(textBlock.text);
    if (!posts) {
      return NextResponse.json(
        { error: "Could not parse response" },
        { status: 502 },
      );
    }

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Post generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function buildPrompt(args: {
  business: string;
  trade: string;
  city: string;
  theme: PostTheme;
}): string {
  const themeGuide: Record<PostTheme, string> = {
    mixed:
      "Mix the post types: one Offer, one What's New (seasonal tip or recently completed job), one Update (operational news a customer cares about), one Event or call-to-action style.",
    offers:
      "All four posts should be Offer-style — discounts, free estimates, seasonal specials, bundle deals, financing. Vary the offer angle.",
    updates:
      "All four posts should be What's New / Update-style — recently completed work, new services, hiring, certifications, equipment, seasonal availability.",
    tips: "All four posts should be educational tips homeowners actually search for in this trade. Each tip leads naturally into a service the business provides.",
  };

  return `Write four Google Business Profile post drafts — one per week for a month — for this business.

<business>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}
</business>

<theme>
${themeGuide[args.theme]}
</theme>

<rules>
- Each post body: 220-380 characters. Hard ceiling 1400 characters. Sweet spot for GBP engagement is short.
- Each post needs a short headline (under 60 characters) — Google shows this in the post preview.
- Mention the city or "${args.city} area" in at least 2 of the 4 posts (signals locality).
- Name specific services typical for the trade. Don't say "all your needs" — say what you actually do.
- No emoji, no all-caps, no exclamation points. One question mark per post is fine.
- 8th-grade reading level. Short sentences are fine.
- CTA label must be one of: "Call now", "Book online", "Get offer", "Learn more", "Sign up", "Order online". Pick the one that fits the post.
- Do not invent specifics that could be wrong (no exact prices, no exact years in business, no fake testimonial quotes, no specific employee names).
</rules>

Return ONLY valid JSON in this exact shape, nothing else:

{
  "posts": [
    {
      "type": "What's New" | "Offer" | "Event" | "Update",
      "headline": "...",
      "body": "...",
      "ctaLabel": "Call now" | "Book online" | "Get offer" | "Learn more" | "Sign up" | "Order online"
    }
  ]
}

Return exactly 4 posts.`;
}

function parsePosts(text: string): Post[] | null {
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

  const rawPosts = (parsed as { posts?: unknown })?.posts;
  if (!Array.isArray(rawPosts)) return null;

  const validTypes = new Set(["What's New", "Offer", "Event", "Update"]);
  const validCtas = new Set(ALLOWED_CTAS as readonly string[]);

  const posts: Post[] = [];
  for (const p of rawPosts) {
    if (!p || typeof p !== "object") continue;
    const obj = p as Record<string, unknown>;
    const type = typeof obj.type === "string" ? obj.type : "";
    const headline =
      typeof obj.headline === "string" ? obj.headline.trim() : "";
    const body = typeof obj.body === "string" ? obj.body.trim() : "";
    const ctaLabel =
      typeof obj.ctaLabel === "string" ? obj.ctaLabel : "Learn more";
    if (!validTypes.has(type) || !headline || !body) continue;
    posts.push({
      type: type as Post["type"],
      headline,
      body,
      ctaLabel: (validCtas.has(ctaLabel) ? ctaLabel : "Learn more") as CtaLabel,
    });
  }

  if (posts.length === 0) return null;
  return posts;
}
