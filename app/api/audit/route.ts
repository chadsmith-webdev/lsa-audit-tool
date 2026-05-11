import { getSupabase } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";
import {
  fetchBacklinksData,
  fetchGBPData,
  fetchPageSpeedData,
  fetchReviewsData,
  fetchSerperData,
  fetchWebsiteData,
  computeAICitabilitySignals,
  type BacklinksData,
  type GBPData,
  type PageSpeedData,
  type ReviewsData,
  type SerperData,
  type WebsiteData,
} from "@/lib/prefetch";
import { ratelimit } from "@/lib/ratelimit";
import { sanitizeString, sanitizeUrl } from "@/lib/audit-helpers";
import { callClaude } from "@/lib/claude";
import type { AuditInput, AuditResult } from "@/lib/types";

export const maxDuration = 120;

async function notifyEmail(
  result: AuditResult,
  input: AuditInput,
  auditId: string | null,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !toEmail) return;

  // Skip notification for obvious test/spam submissions
  const SPAM_PATTERNS =
    /\b(test|testing|asdf|qwerty|foo|bar|baz|example|sample|lorem|dummy|fake)\b/i;
  if (
    SPAM_PATTERNS.test(input.businessName) ||
    SPAM_PATTERNS.test(input.serviceCity) ||
    input.businessName.trim().length < 4
  ) {
    console.log(
      "Skipping notify email — looks like a test submission:",
      input.businessName,
    );
    return;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://localsearchally.com";
  const auditLink = auditId ? `${siteUrl}/audit/${auditId}` : siteUrl;
  const scoreColor =
    result.overall_score >= 8
      ? "#00ff88"
      : result.overall_score >= 5
        ? "#ffcc00"
        : "#ff4d4d";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Audit — ${input.businessName}</title>
</head>
<body style="margin:0;padding:0;background:#020203;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020203;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#7bafd4;font-weight:600;">
                Local Search Ally · New Audit Lead
              </p>
            </td>
          </tr>

          <!-- Score block -->
          <tr>
            <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-top:2px solid #7bafd4;border-radius:12px;padding:28px 32px;">
              <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.3);">
                ${input.primaryTrade} · ${input.serviceCity}
              </p>
              <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.2;">
                ${input.businessName}
              </h1>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:20px;">
                    <p style="margin:0;font-size:48px;font-weight:700;color:${scoreColor};font-family:'Courier New',monospace;line-height:1;">
                      ${result.overall_score}<span style="font-size:20px;color:rgba(255,255,255,0.3)">/10</span>
                    </p>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 2px;font-size:16px;font-weight:600;color:#ffffff;">${result.score_bucket}</p>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);">Overall SEO Score</p>
                  </td>
                </tr>
              </table>
              ${input.websiteUrl ? `<p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.35);">Website: ${input.websiteUrl}</p>` : `<p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.35);">No website listed</p>`}
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding:24px 0;">
              <p style="margin:0;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.6);">
                ${result.summary}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${auditLink}"
                style="display:inline-block;background:#7bafd4;color:#020203;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;padding:13px 26px;">
                View Full Audit →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6;">
                Local Search Ally · Internal notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Local Search Ally <noreply@localsearchally.com>",
    to: toEmail,
    subject: `New audit: ${input.businessName} — ${result.overall_score}/10 (${result.score_bucket})`,
    html,
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

export async function POST(req: Request) {
  let input: AuditInput;
  try {
    const raw = await req.json();
    input = {
      businessName: sanitizeString(raw.businessName, 100),
      websiteUrl: sanitizeUrl(raw.websiteUrl),
      primaryTrade: sanitizeString(raw.primaryTrade, 50),
      serviceCity: sanitizeString(raw.serviceCity, 100),
    };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ─── Resolve identity for rate limiting ───────────────────────────────────
  // Prefer userId (per-user bucket) over IP (shared-network bucket).
  // Anonymous users fall back to IP — they still get their own quota as long
  // as they're the only person on their IP, which is typical for home users.
  let rateLimitKey: string;
  let resolvedUserId: string | null = null;
  try {
    const anonClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return (
              req.headers
                .get("cookie")
                ?.split(";")
                .map((c) => {
                  const [name, ...rest] = c.trim().split("=");
                  return { name: name.trim(), value: rest.join("=") };
                }) ?? []
            );
          },
          setAll() {},
        },
      },
    );
    const {
      data: { user: sessionUser },
    } = await anonClient.auth.getUser();
    resolvedUserId = sessionUser?.id ?? null;
    if (resolvedUserId) {
      rateLimitKey = `user:${resolvedUserId}`;
    } else {
      const ip =
        (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
        "anonymous";
      rateLimitKey = `ip:${ip}`;
    }
  } catch {
    const ip =
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      "anonymous";
    rateLimitKey = `ip:${ip}`;
  }

  let rateLimited = false;
  try {
    const { success } = await ratelimit.limit(rateLimitKey);
    rateLimited = !success;
  } catch (err) {
    console.error("Ratelimit error (failing open):", err);
  }
  if (rateLimited) {
    return Response.json(
      {
        error:
          "You've already run all your free audits this month. Come back in 30 days.",
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
        if (input.websiteUrl) {
          const { data: cached, error: cacheErr } = await getSupabase()
            .from("audits")
            .select("*")
            .eq("input->>websiteUrl", input.websiteUrl)
            .eq("input->>businessName", input.businessName)
            .gte("created_at", new Date(Date.now() - 86_400_000).toISOString())
            .maybeSingle();
          if (cacheErr)
            console.error("Supabase cache lookup failed:", cacheErr);

          if (cached && cached.result?.ai_citability_section) {
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

        // --- Pre-fetch all signals in parallel (failures degrade per-block) ---
        send("status", {
          message: "Pulling your Google listing, reviews, and site data…",
        });
        const failedBlocks = new Set<string>();
        const tag =
          <T>(key: string, fallback: T) =>
          (p: Promise<T>): Promise<T> =>
            p.catch((err) => {
              console.error(`Pre-fetch failed [${key}]:`, err);
              failedBlocks.add(key);
              return fallback;
            });

        const [
          gbpData,
          pagespeedData,
          serperData,
          websiteData,
          backlinksData,
          reviewsData,
        ] = await Promise.all([
          tag("gbp", { found: false } as GBPData)(
            fetchGBPData(input.businessName, input.serviceCity),
          ),
          !input.websiteUrl
            ? Promise.resolve<PageSpeedData>({})
            : tag("pagespeed", {
                fetchError: "pre-fetch failed",
              } as PageSpeedData)(fetchPageSpeedData(input.websiteUrl)),
          tag("serper", { results: [] } as SerperData)(
            fetchSerperData(input.primaryTrade, input.serviceCity),
          ),
          !input.websiteUrl
            ? Promise.resolve(null)
            : tag<WebsiteData | null>(
                "website",
                null,
              )(fetchWebsiteData(input.websiteUrl)),
          !input.websiteUrl
            ? Promise.resolve(null)
            : tag<BacklinksData | null>(
                "backlinks",
                null,
              )(fetchBacklinksData(input.websiteUrl)),
          tag("reviews", { reviews: [] } as ReviewsData)(
            fetchReviewsData(input.businessName, input.serviceCity),
          ),
        ]);

        // --- Compute AI Citability signals (pure, no I/O) ---
        const aiCitabilitySignals = computeAICitabilitySignals(
          gbpData,
          websiteData,
          reviewsData,
        );

        send("status", { message: "Data collected — running AI analysis…" });

        // --- Run Claude audit ---
        const result = await callClaude(
          input,
          {
            gbp: gbpData,
            pagespeed: pagespeedData,
            serper: serperData,
            website: websiteData,
            backlinks: backlinksData,
            reviews: reviewsData,
            failedBlocks,
            aiCitabilitySignals,
          },
          abortController.signal,
        );
        clearTimeout(timer);

        // --- Stream sections with 150ms stagger ---
        for (const section of result.sections) {
          send("section", section);
          await new Promise((r) => setTimeout(r, 150));
        }

        // --- Persist to Supabase ---
        // userId was resolved earlier during rate limiting — reuse it here.
        const userId: string | null = resolvedUserId;

        let auditId: string | null = null;
        try {
          const { data: row, error: dbErr } = await getSupabase()
            .from("audits")
            .insert({
              business_name: result.business_name,
              overall_score: result.overall_score,
              score_bucket: result.score_bucket,
              trade: input.primaryTrade,
              city: input.serviceCity,
              ai_citability_score: result.ai_citability_score ?? null,
              ai_citability_section: result.ai_citability_section ?? null,
              result,
              input,
              user_id: userId,
              // Raw GBP snapshot — stored separately for dashboard widgets
              gbp_rating: gbpData.found ? (gbpData.rating ?? null) : null,
              gbp_review_count: gbpData.found
                ? (gbpData.reviewCount ?? null)
                : null,
              gbp_photo_count: gbpData.found
                ? (gbpData.photoCount ?? null)
                : null,
              gbp_has_hours: gbpData.found ? (gbpData.hasHours ?? null) : null,
              gbp_found: gbpData.found,
            })
            .select("id")
            .single();
          if (dbErr) console.error("Supabase insert failed:", dbErr);
          auditId = row?.id ?? null;
        } catch (dbEx) {
          console.error("Supabase insert exception:", dbEx);
        }

        // --- Email notification (before complete so it fires before client can navigate away) ---
        await notifyEmail(result, input, auditId).catch((e) =>
          console.error("Email notify failed:", e),
        );

        send("complete", { ...result, auditId });
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === "AbortError") {
          send("error", {
            message:
              "The audit took too long — try again, it usually completes.",
          });
        } else {
          send("error", {
            message: err instanceof Error ? err.message : "Unknown error",
          });
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
