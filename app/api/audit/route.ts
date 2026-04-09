import { supabase } from "@/lib/supabase";
import {
  fetchGBPData,
  fetchPageSpeedData,
  formatGBPBlock,
  formatPageSpeedBlock,
  type GBPData,
  type PageSpeedData,
} from "@/lib/prefetch";
import { ratelimit } from "@/lib/ratelimit";

export const maxDuration = 120;

export type AuditInput = {
  businessName: string;
  websiteUrl: string;
  primaryTrade: string;
  serviceCity: string;
  noWebsite: boolean;
};

export interface AuditSection {
  id: string;
  name: string;
  score: number;
  status: "green" | "yellow" | "red";
  headline: string;
  finding: string;
  priority_action: string;
}

export interface AuditResult {
  business_name: string;
  overall_score: number;
  overall_label: "Strong" | "Solid" | "Needs Work" | "Critical";
  summary: string;
  has_website: boolean;
  score_bucket: "Critical" | "Needs Work" | "Solid" | "Strong";
  sections: AuditSection[];
  top_3_actions: string[];
  competitor_names: string[];
}

const SYSTEM_PROMPT = `You are a local SEO specialist auditing a contractor's online presence for Local Search Ally. Research the business using web search and produce an honest, scored audit across 7 sections. Return ONLY valid JSON — no preamble, no markdown.

AUDIT SECTIONS (score each 1–10):
1. gbp — Google Business Profile: claimed, complete, keyword-optimized description, active with posts? Note photo count specifically — under 10 photos is a critical gap.
2. reviews — Quantity, recency, average rating, owner response rate. Under 10 reviews or zero responses = red.
3. onpage — Title tags, H1s, dedicated service pages, keyword targeting (trade + city).
4. technical — Core Web Vitals (LCP, INP, CLS from PageSpeed Insights if findable), mobile-friendly, HTTPS, sitemap.xml present, AND schema markup: is there a <script type="application/ld+json"> block with @type LocalBusiness or a trade subtype (Plumber, HVACBusiness, Electrician, RoofingContractor)? Does it include name, address, phone, serviceArea, openingHours?
5. citations — NAP consistency across Google, Yelp, BBB, Angi, HomeAdvisor.
6. backlinks — Domain authority signals, local/industry links, anchor text quality.
7. competitors — Top 3 Map Pack results for [trade] [city] AR. How does this business compare on reviews, GBP completeness, and web presence?

NO-WEBSITE HANDLING: If the business has no website, score onpage, technical, and backlinks as 1 each. Set headline to "No website — invisible to every search that doesn't start on Google Maps." Skip URL-based checks for those sections only.

SCORING:
- 8–10 → status: "green"
- 5–7  → status: "yellow"
- 1–4  → status: "red"

PRE-FETCHED DATA: The audit prompt will contain a PRE-FETCHED DATA block with authoritative GBP and PageSpeed data pulled directly from Google APIs. You MUST use these values verbatim for the gbp and technical sections — do not contradict or override them with web search findings. If the data says GBP_EXISTS: NO, score gbp as red regardless of what search shows.

SEARCH STRATEGY:
- Use web search for: reviews (recency, owner response rate), onpage (title tags, H1s, service pages), citations (Yelp, BBB, Angi), backlinks, and competitors
- Search "[trade] [city] AR" → top 3 Map Pack competitors
- Search "[business name]" on Yelp, Angi, BBB for NAP consistency
- Do NOT use web search to determine GBP existence or Core Web Vitals — those come from PRE-FETCHED DATA

REQUIRED JSON:
{
  "business_name": string,
  "overall_score": number (average of 7 sections, rounded),
  "overall_label": "Strong" | "Solid" | "Needs Work" | "Critical",
  "summary": string (1 sentence, plain English, specific),
  "has_website": boolean,
  "score_bucket": "Critical" | "Needs Work" | "Solid" | "Strong",
  "sections": [{
    "id": "gbp|reviews|onpage|technical|citations|backlinks|competitors",
    "name": string,
    "score": number (1–10),
    "status": "green" | "yellow" | "red",
    "headline": string (plain English, no jargon),
    "finding": string (2–3 sentences, business impact, specific),
    "priority_action": string (specific next step)
  }],
  "top_3_actions": string[],
  "competitor_names": string[]
}

SUMMARY: 1–2 sentences. Frame around the score:
- Score 1–3 (Critical): "[Business Name] is effectively invisible to local search — [specific primary gap] is the main reason customers can't find them."
- Score 4–6 (Needs Work): "[Business Name] shows up occasionally but lacks the signals to stay visible when customers are ready to call — [specific primary gap] is the biggest leak."
- Score 7–9 (Solid): "[Business Name] is in the fight for Map Pack visibility, but [specific primary gap] is letting competitors steal leads."
- Score 10 (Strong): "[Business Name] has strong local visibility across all 7 factors — no critical gaps found."

VOICE: Plain English. Every finding names a business consequence (lost calls, lost jobs, invisible on Google). Never invent data. Frame every gap around the invisibility problem — getting hidden from the Map Pack is the villain, not the technical issue itself.

FINDING TRANSLATIONS (use this framing — adapt to the specific facts found):
- Missing/unclaimed GBP: "Without a claimed profile, [Business Name] doesn't exist to Google Maps. Customers searching for [trade] in [city] right now can't find this business at all."
- Zero or unanswered reviews: "Silence tells Google the business is inactive. When customers compare options, they choose whoever is talking back — and that's not [Business Name] right now."
- Missing schema markup: "The website isn't speaking Google's language. Without LocalBusiness schema, Google can't confidently verify the business location or trade — which keeps it out of the Map Pack."
- NAP inconsistencies: "Inconsistent name, address, or phone across directories causes Google to lose trust in the listing. Confused signals = lower rankings."
- Thin or missing service pages: "Google can't rank a page that doesn't exist. Without dedicated pages for [specific services], this business is invisible for the searches that convert to calls."
- No website: "Every search that doesn't start on Google Maps leads nowhere. Without a website, there's no way to capture the majority of local search traffic."`;

function buildAuditPrompt(
  input: AuditInput,
  prefetch: { gbp: GBPData; pagespeed: PageSpeedData },
): string {
  const websiteLine = input.noWebsite
    ? "Website: NONE — this business has no website"
    : `Website: ${input.websiteUrl}`;

  const noWebsiteNote = input.noWebsite
    ? "\nNOTE: No website. Score onpage, technical, backlinks as 1. Focus on GBP, reviews, citations, competitors."
    : "";

  const prefetchBlock = `
PRE-FETCHED DATA (authoritative — do not contradict):
${formatGBPBlock(prefetch.gbp)}
${
  input.noWebsite
    ? "PAGESPEED: Skipped — no website."
    : formatPageSpeedBlock(prefetch.pagespeed)
}`;

  return `Audit this contractor's local SEO:

Business Name: ${input.businessName}
${websiteLine}
Primary Trade: ${input.primaryTrade}
Service City: ${input.serviceCity}
${noWebsiteNote}
${prefetchBlock}

Use the PRE-FETCHED DATA above for gbp and technical sections. Use web search for reviews, onpage, citations, backlinks, and competitors. Return the JSON audit result only.`.trim();
}

function parseAuditResult(rawText: string): AuditResult {
  // Strip any accidental markdown code fences
  const cleaned = rawText
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

async function callClaude(
  input: AuditInput,
  prefetch: { gbp: GBPData; pagespeed: PageSpeedData },
  signal: AbortSignal,
): Promise<AuditResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  async function attempt(prompt: string): Promise<AuditResult> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        system: SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        temperature: 0.2,
      }),
      signal,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${details}`);
    }

    const data = await response.json();
    const textBlock = (data.content as any[]).findLast(
      (b: any) => b.type === "text",
    );
    if (!textBlock) throw new Error("No text block in Anthropic response");
    return parseAuditResult(textBlock.text);
  }

  try {
    return await attempt(buildAuditPrompt(input, prefetch));
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      // Retry once with explicit JSON reminder
      return await attempt(
        buildAuditPrompt(input, prefetch) +
          "\n\nReturn ONLY JSON, no other text.",
      );
    }
    throw err;
  }
}

async function notifySlack(
  result: AuditResult,
  input: AuditInput,
  auditId: string,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://localsearchally.com";
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "🔔 New audit completed",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${input.businessName}* — ${input.primaryTrade} in ${input.serviceCity}\nScore: *${result.overall_score}/10* (${result.score_bucket})\n<${siteUrl}/audit/${auditId}|View audit>`,
          },
        },
      ],
    }),
  });
}

export async function POST(req: Request) {
  let input: AuditInput;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  let rateLimited = false;
  try {
    const { success } = await ratelimit.limit(ip);
    rateLimited = !success;
  } catch (err) {
    console.error("Ratelimit error (failing open):", err);
  }
  if (rateLimited) {
    return Response.json(
      {
        error:
          "You've already run a free audit this month. Come back in 30 days.",
      },
      { status: 429 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Missing Anthropic API key" },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const abortController = new AbortController();
      const timer = setTimeout(() => abortController.abort(), 120_000);

      try {
        // --- 24-hour cache check ---
        if (!input.noWebsite && input.websiteUrl) {
          const { data: cached } = await supabase
            .from("audits")
            .select("*")
            .eq("input->>websiteUrl", input.websiteUrl)
            .gte("created_at", new Date(Date.now() - 86_400_000).toISOString())
            .maybeSingle();

          if (cached) {
            const cachedResult: AuditResult = cached.result;
            for (const section of cachedResult.sections) {
              send("section", section);
              await new Promise((r) => setTimeout(r, 150));
            }
            send("complete", {
              ...cachedResult,
              auditId: cached.id,
              cached: true,
            });
            controller.close();
            return;
          }
        }

        // --- Pre-fetch GBP + PageSpeed in parallel ---
        const [gbpData, pagespeedData] = await Promise.all([
          fetchGBPData(input.businessName, input.serviceCity),
          input.noWebsite || !input.websiteUrl
            ? Promise.resolve<PageSpeedData>({})
            : fetchPageSpeedData(input.websiteUrl),
        ]);

        // --- Run Claude audit ---
        const result = await callClaude(
          input,
          { gbp: gbpData, pagespeed: pagespeedData },
          abortController.signal,
        );
        clearTimeout(timer);

        // --- Stream sections with 150ms stagger ---
        for (const section of result.sections) {
          send("section", section);
          await new Promise((r) => setTimeout(r, 150));
        }

        // --- Persist to Supabase ---
        let auditId: string | null = null;
        try {
          const { data: row } = await supabase
            .from("audits")
            .insert({
              business_name: result.business_name,
              overall_score: result.overall_score,
              score_bucket: result.score_bucket,
              trade: input.primaryTrade,
              city: input.serviceCity,
              result,
              input,
            })
            .select("id")
            .single();
          auditId = row?.id ?? null;
        } catch (dbErr) {
          console.error("Supabase insert failed:", dbErr);
        }

        send("complete", { ...result, auditId });

        // --- Slack notification (non-blocking) ---
        if (auditId) {
          console.log;
          notifySlack(result, input, auditId).catch((e) =>
            console.error("Slack notify failed:", e),
          );
        }
      } catch (err: any) {
        clearTimeout(timer);
        if (err.name === "AbortError") {
          send("error", {
            message:
              "The audit took too long — try again, it usually completes.",
          });
        } else {
          send("error", { message: err.message ?? "Unknown error" });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
