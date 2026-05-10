import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";

/**
 * POST /api/tools/gbp/reviews
 *
 * Two modes:
 *   mode: "reply"   — generate 3 reply variants for a customer review.
 *                     Body: { auditId, mode: "reply", rating: 1-5, reviewerName?, reviewText, serviceMentioned? }
 *
 *   mode: "request" — generate 3 review-request templates for a channel.
 *                     Body: { auditId, mode: "request", channel: "sms"|"email"|"post_job"|"in_person" }
 *
 * Returns: { variants: [{ label, text, subject? }] }
 *
 * Best-practice baseline (May 2026):
 * - Replies must avoid AI-tells: Google's review spam classifier flags formulaic
 *   responses, identical openers across reviews, and over-long replies. Keep 2-4
 *   sentences, vary openers, no em dashes used as filler.
 * - Reviewer name + a specific detail from the review = signal of authenticity.
 * - Negative replies: acknowledge → apologize without admitting fault → invite
 *   offline ("call us at" / "email manager@") — never argue publicly.
 * - Requests: never offer incentives (against Google policy and gets reviews
 *   filtered). SMS outperforms email ~3-5x. Send within 24h of job completion.
 *   Use direct GBP review link, not a screenshot of stars.
 */

const REPLY_RULES = `
- 2-4 sentences total. Concise replies outperform long ones in 2025-2026 data.
- Use the reviewer's first name once if provided. Don't overuse it (sounds robotic).
- Reference one specific detail from their review (the service, location, named team member if they mentioned one). This is the strongest authenticity signal.
- Vary the opener across the three variants. Do not start every variant with "Thank you" or "Thanks".
- No emoji, no all-caps, no exclamation points beyond one.
- 8th-grade reading level. Contractions are fine ("we're", "you're").
- Never mention prices, never re-pitch services, never plead for more reviews.
- Avoid AI-tells: no "We're thrilled to hear", "It means the world", "We strive to", "delighted to serve". These phrases are fingerprinted by Google's review classifier.
- For 1-2 star reviews: acknowledge concern, apologize without admitting legal fault, give a real way to reach a human (phone or email — use a placeholder like "[your manager email]"). Never argue specifics in public.
- For 3 star reviews: thank for honest feedback, acknowledge the gap, invite to share more so you can fix it.
- For 4-5 star reviews: name the specific service or detail, brief warmth, no over-the-top language.
`;

const REQUEST_RULES = `
- Never offer money, discounts, gift cards, entries into raffles, or any incentive in exchange for reviews. Against Google policy and the review will be filtered or removed.
- Send within 24 hours of job completion. Mention this timing in the message naturally (e.g. "while it's fresh").
- Use the customer's first name. Mention what you did for them (named service, not "your project").
- Make the review link a clear next step. Use the placeholder "{review_link}" for templates — the user will paste in their direct GBP short link.
- Lower the perceived ask. "If you have 30 seconds" / "even one sentence helps" performs better than "share your experience".
- No emoji except where channel norms allow (one in SMS is fine, none in email body, none in in-person card).
- 8th-grade reading level. Short sentences.
- Tone: grateful, low-pressure, human. Not corporate.
`;

const CHANNEL_GUIDES = {
  sms: `
Channel: SMS (text message).
- 160 characters per template if possible, hard ceiling 280.
- First name + named service + review link + soft out ("no worries if not").
- Variant 1: ultra-short, just the ask.
- Variant 2: short with one line of warmth.
- Variant 3: includes a soft reason ("helps other neighbors find us").
- Sender identity must be implied by signing off ("- {Owner first name} at {Business name}") or naming the business at the start.
`,
  email: `
Channel: Email.
- Each variant needs a subject line (subject field). 30-50 chars. No clickbait, no all-caps, no exclamations.
- Body: 60-110 words. Three short paragraphs: thanks for the work, the soft ask with link, sign-off.
- Variant 1: short and direct.
- Variant 2: warm and personal, references the service.
- Variant 3: includes a small "why this helps small businesses" line.
- Use {first_name}, {business_name}, {owner_name}, {service}, {review_link} as placeholders.
`,
  post_job: `
Channel: Post-job follow-up (sent same-day after completion, channel-agnostic — owner picks SMS or email).
- 60-100 words.
- Open by referencing what was just completed today.
- The ask is anchored to "while it's fresh".
- Variant 1: post-installation/repair.
- Variant 2: post-consultation/estimate (where work hasn't started but the experience can still be reviewed).
- Variant 3: post-emergency / urgent service.
`,
  in_person: `
Channel: In-person hand-off card or QR card the tech leaves at the job site.
- 30-60 words on the card. Must work as printed copy that can't be personalized per customer.
- One line of warmth, one line ask, line for the QR code or short link.
- Variant 1: standard thank-you card copy.
- Variant 2: clipboard / invoice-back side copy.
- Variant 3: door hanger / leave-behind.
`,
} as const;

type Mode = "reply" | "request";
type Channel = keyof typeof CHANNEL_GUIDES;
type Variant = { label: string; text: string; subject?: string };

const VALID_CHANNELS = Object.keys(CHANNEL_GUIDES) as Channel[];

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const auditId = typeof body.auditId === "string" ? body.auditId : null;
  if (!auditId) {
    return NextResponse.json({ error: "auditId required" }, { status: 400 });
  }
  const mode =
    body.mode === "reply" || body.mode === "request"
      ? (body.mode as Mode)
      : null;
  if (!mode) {
    return NextResponse.json({ error: "mode required" }, { status: 400 });
  }

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

  let prompt: string;
  if (mode === "reply") {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "rating must be 1-5" },
        { status: 400 },
      );
    }
    const reviewText =
      typeof body.reviewText === "string"
        ? body.reviewText.trim().slice(0, 2000)
        : "";
    if (!reviewText) {
      return NextResponse.json(
        { error: "reviewText required" },
        { status: 400 },
      );
    }
    const reviewerName =
      typeof body.reviewerName === "string"
        ? body.reviewerName.trim().slice(0, 80)
        : "";

    prompt = buildReplyPrompt({
      business: audit.business_name,
      trade: audit.trade,
      city: audit.city,
      rating,
      reviewerName,
      reviewText,
    });
  } else {
    const channelRaw = typeof body.channel === "string" ? body.channel : "";
    if (!VALID_CHANNELS.includes(channelRaw as Channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }
    prompt = buildRequestPrompt({
      business: audit.business_name,
      trade: audit.trade,
      city: audit.city,
      channel: channelRaw as Channel,
    });
  }

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
          "You are a senior local marketing copywriter who writes Google Business Profile review replies and review requests for small contractors. You write the way a small-business owner actually talks to customers — plain, warm, brief. You avoid AI-tells (no 'thrilled to hear', 'means the world', 'strive to', 'delighted to'). You avoid marketing fluff (no 'leading', 'premier', 'committed to excellence'). You know Google's 2025-2026 review policies and never suggest incentivizing reviews. You always return only valid JSON when asked.",
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

    const variants = parseVariants(textBlock.text, mode);
    if (!variants) {
      return NextResponse.json(
        { error: "Could not parse response" },
        { status: 502 },
      );
    }

    return NextResponse.json({ variants });
  } catch (err) {
    console.error("Review tool error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function buildReplyPrompt(args: {
  business: string;
  trade: string;
  city: string;
  rating: number;
  reviewerName: string;
  reviewText: string;
}): string {
  const sentiment =
    args.rating <= 2 ? "negative" : args.rating === 3 ? "mixed" : "positive";

  return `Write three reply variants to this customer review for our Google Business Profile.

<business>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}
</business>

<review>
Rating: ${args.rating} of 5 (${sentiment})
Reviewer: ${args.reviewerName || "(not provided)"}
Text: ${args.reviewText}
</review>

<rules>
${REPLY_RULES}
</rules>

Return three variants:
1. **Short** — 2 sentences. Tightest possible reply that still feels personal.
2. **Standard** — 3 sentences. Adds one specific reference from the review.
3. **Detailed** — 4 sentences. Adds a soft offer to talk more (positive) or to make it right (negative).

Return ONLY valid JSON in this exact shape, nothing else:

{
  "variants": [
    { "label": "Short", "text": "..." },
    { "label": "Standard", "text": "..." },
    { "label": "Detailed", "text": "..." }
  ]
}`;
}

function buildRequestPrompt(args: {
  business: string;
  trade: string;
  city: string;
  channel: Channel;
}): string {
  const channelGuide = CHANNEL_GUIDES[args.channel];
  const needsSubject = args.channel === "email";

  return `Write three review-request templates for this contractor to send to recent satisfied customers.

<business>
Name: ${args.business}
Trade: ${args.trade}
City: ${args.city}
</business>

<channel_guide>
${channelGuide}
</channel_guide>

<rules>
${REQUEST_RULES}
</rules>

Use these placeholders so the user can fill them in:
- {first_name} — customer's first name
- {service} — what was done (e.g. "the bathroom remodel", "your AC tune-up")
- {review_link} — the contractor's direct Google review link
- {business_name} — already known: ${args.business}
- {owner_name} — owner's first name (for sign-off)

Return three variants. Each has a label and text${needsSubject ? " and an email subject" : ""}.

Return ONLY valid JSON in this exact shape, nothing else:

{
  "variants": [
    { "label": "...", ${needsSubject ? `"subject": "...", ` : ""}"text": "..." }
  ]
}

Return exactly 3 variants.`;
}

function parseVariants(text: string, mode: Mode): Variant[] | null {
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

  const raw = (parsed as { variants?: unknown })?.variants;
  if (!Array.isArray(raw)) return null;

  const variants: Variant[] = [];
  for (const v of raw) {
    if (!v || typeof v !== "object") continue;
    const obj = v as Record<string, unknown>;
    const label = typeof obj.label === "string" ? obj.label.trim() : "";
    const textVal = typeof obj.text === "string" ? obj.text.trim() : "";
    if (!label || !textVal) continue;
    const variant: Variant = { label, text: textVal };
    if (mode === "request" && typeof obj.subject === "string") {
      variant.subject = obj.subject.trim();
    }
    variants.push(variant);
  }

  if (variants.length === 0) return null;
  return variants;
}
