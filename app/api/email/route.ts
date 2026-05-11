import { Resend } from "resend";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { AuditPdf } from "@/lib/AuditPdf";
import { getSupabase } from "@/lib/supabase";
import { ratelimit } from "@/lib/ratelimit";
import { SECTION_LABELS } from "@/lib/types";

export const maxDuration = 60;

export type EmailPayload = {
  email: string;
  auditId: string | null;
  businessName: string;
  trade: string;
  city: string;
  scoreBucket: string;
  overallScore: number;
  lowestSection: string;
};

// SECTION_LABELS imported from @/lib/types — single source of truth

// ─── Input sanitization ───────────────────────────────────────────────────────

function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLen);
}

export async function POST(req: Request) {
  let body: EmailPayload;
  try {
    const raw = await req.json();
    body = {
      email:
        typeof raw.email === "string" ? raw.email.trim().slice(0, 254) : "",
      auditId:
        typeof raw.auditId === "string" ? raw.auditId.slice(0, 36) : null,
      businessName: sanitizeString(raw.businessName, 100),
      trade: sanitizeString(raw.trade, 50),
      city: sanitizeString(raw.city, 100),
      scoreBucket: sanitizeString(raw.scoreBucket, 20),
      overallScore:
        typeof raw.overallScore === "number"
          ? Math.min(Math.max(Math.round(raw.overallScore), 1), 10)
          : 5,
      lowestSection: sanitizeString(raw.lowestSection, 30),
    };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    email,
    auditId,
    businessName,
    trade,
    city,
    scoreBucket,
    overallScore,
    lowestSection,
  } = body;

  // Rate limit by IP — prevents email spam abuse
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "anonymous";
  try {
    const { success } = await ratelimit.limit(`email:${ip}`);
    if (!success) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }
  } catch (err) {
    console.error("Ratelimit error on /api/email (failing open):", err);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return Response.json(
      { error: "Email service not configured" },
      { status: 500 },
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://localsearchally.com";
  const calendlyUrl =
    process.env.CALENDLY_URL ??
    process.env.NEXT_PUBLIC_CALENDLY_URL ??
    "https://calendly.com/localsearchally";
  const auditUrl = auditId ? `${siteUrl}/audit/${auditId}` : siteUrl;
  const signupUrl = `${siteUrl}/signup`;
  const pricingUrl = `${siteUrl}/pricing`;
  const dashboardUrl = `${siteUrl}/dashboard`;
  const lowestLabel = SECTION_LABELS[lowestSection] ?? lowestSection;
  // /pricing?gate=<section> names the tool on the pricing page (see GATE_TOOL_NAMES)
  // and works for both anonymous and signed-in users.
  const lowestToolUrl = lowestSection
    ? `${pricingUrl}?gate=${encodeURIComponent(lowestSection)}`
    : pricingUrl;

  const resend = new Resend(resendKey);

  // ── Generate PDF if auditId provided ────────────────────────────────────
  let pdfAttachment:
    | { filename: string; content: Buffer; contentType: string }
    | undefined;

  if (auditId) {
    try {
      const { data: auditRow } = await getSupabase()
        .from("audits")
        .select("result, input")
        .eq("id", auditId)
        .single();

      if (auditRow?.result) {
        const pdfElement = createElement(AuditPdf, {
          result: auditRow.result,
          trade,
          city,
          calendlyUrl,
        }) as unknown as ReactElement<DocumentProps>;
        const pdfBuffer = await renderToBuffer(pdfElement);
        pdfAttachment = {
          filename: `local-seo-audit-${businessName.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        };
      }
    } catch (err) {
      // Non-fatal: send email without attachment if PDF generation fails
      console.error("PDF generation error:", err);
    }
  }

  const unsubscribeMailto = `mailto:unsubscribe@localsearchally.com?subject=Unsubscribe&body=${encodeURIComponent(email)}`;

  // ── Send confirmation email ──────────────────────────────────────────────
  try {
    const sendResult = await resend.emails.send({
      from: "Chad Smith <chad@localsearchally.com>",
      to: email,
      subject: `Your Local SEO Audit — ${businessName}`,
      html: buildEmailHtml({
        businessName,
        trade,
        city,
        scoreBucket,
        overallScore,
        lowestLabel,
        auditUrl,
        signupUrl,
        pricingUrl,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
      headers: {
        "List-Unsubscribe": `<${unsubscribeMailto}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      ...(pdfAttachment ? { attachments: [pdfAttachment] } : {}),
    });
    console.log("Resend send result:", sendResult);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Resend error:", msg);
    return Response.json(
      { error: "Failed to send email: " + msg },
      { status: 500 },
    );
  }

  // ── Slack notification ───────────────────────────────────────────────────
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    try {
      const slackRes = await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "🔔 New audit lead",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${businessName}* — ${trade} in ${city}\nScore: *${overallScore}/10* (${scoreBucket})\nEmail: ${email}\n<${auditUrl}|View audit>`,
              },
            },
          ],
        }),
      });
      if (!slackRes.ok) {
        const body = await slackRes.text();
        console.error("Slack notify failed:", slackRes.status, body);
      }
    } catch (err) {
      console.error("Slack notify error:", err);
    }
  }

  // ── Internal lead notification ───────────────────────────────────────────
  resend.emails
    .send({
      from: "Chad Smith <chad@localsearchally.com>",
      to: "chad@localsearchally.com",
      subject: `🔔 New audit lead — ${businessName}`,
      html: `<p><strong>${businessName}</strong> — ${trade} in ${city}</p>
<p>Score: <strong>${overallScore}/10</strong> (${scoreBucket})</p>
<p>Email: ${email}</p>
<p><a href="${auditUrl}">View audit</a></p>`,
    })
    .catch((err) => console.error("Internal notify failed:", err));

  // ── Resend audience tagging (non-blocking) ──────────────────────────────
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (audienceId) {
    resend.contacts
      .create({
        audienceId,
        email,
        firstName: businessName,
        lastName: "audit",
        unsubscribed: false,
      })
      .catch((err) => console.error("Resend contact create failed:", err));
  }

  // ── Schedule drip sequence (non-blocking) ───────────────────────────────
  const drips = [
    {
      daysOut: 2,
      subject: `What to fix first at ${businessName}`,
      html: buildDripDay2Html({
        businessName,
        lowestLabel,
        lowestToolUrl,
        signupUrl,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
    },
    {
      daysOut: 5,
      subject: `Why ${trade} contractors in the Map Pack pull 3× more calls`,
      html: buildDripDay5Html({
        businessName,
        trade,
        signupUrl,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
    },
    {
      daysOut: 9,
      subject: `How a ${trade.toLowerCase()} contractor climbed into the Map Pack`,
      html: buildDripDay9Html({
        businessName,
        trade,
        signupUrl,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
    },
    {
      daysOut: 14,
      subject: `"I tried SEO before and it didn't work"`,
      html: buildDripDay14Html({
        businessName,
        trade,
        signupUrl,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
    },
    {
      daysOut: 21,
      subject: `Last note from Local Search Ally`,
      html: buildDripDay21Html({
        businessName,
        trade,
        signupUrl,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
    },
    {
      daysOut: 28,
      subject: `Your free audit refresh is ready — run it again for ${businessName}`,
      html: buildReauditReminderHtml({
        businessName,
        trade,
        city,
        siteUrl,
        dashboardUrl,
        signupUrl,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
    },
  ];

  for (const drip of drips) {
    const scheduledAt = new Date(
      Date.now() + drip.daysOut * 24 * 60 * 60 * 1000,
    ).toISOString();
    resend.emails
      .send({
        from: "Chad Smith <chad@localsearchally.com>",
        to: email,
        subject: drip.subject,
        html: drip.html,
        scheduledAt,
        headers: {
          "List-Unsubscribe": `<${unsubscribeMailto}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      })
      .then(async (res) => {
        // Persist the Resend id so we can cancel the send if the lead
        // converts before this drip fires. See lib/cancel-drips.ts.
        const resendId = res?.data?.id;
        if (!resendId) return;
        try {
          await getSupabase().from("scheduled_drips").insert({
            email,
            audit_id: auditId,
            resend_id: resendId,
            subject: drip.subject,
            scheduled_at: scheduledAt,
          });
        } catch (err) {
          console.error(
            `Drip day-${drip.daysOut} persist failed (non-fatal):`,
            err,
          );
        }
      })
      .catch((err) =>
        console.error(`Drip day-${drip.daysOut} schedule failed:`, err),
      );
  }

  return Response.json({ ok: true });
}

// ─── Email HTML template ───────────────────────────────────────────────────────

function buildEmailHtml({
  businessName,
  trade,
  city,
  scoreBucket,
  overallScore,
  lowestLabel,
  auditUrl,
  signupUrl,
  pricingUrl,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  trade: string;
  city: string;
  scoreBucket: string;
  overallScore: number;
  lowestLabel: string;
  auditUrl: string;
  signupUrl: string;
  pricingUrl: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  const scoreColor =
    overallScore >= 8 ? "#22c55e" : overallScore >= 5 ? "#eab308" : "#ef4444";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Local SEO Audit — ${businessName}</title>
</head>
<body bgcolor="#020203" style="margin:0;padding:0;background:#020203;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#020203" style="background:#020203;">
    <tr>
      <td align="center" bgcolor="#020203" style="padding:40px 16px;background:#020203;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#7bafd4;font-weight:600;">
                Local Search Ally
              </p>
            </td>
          </tr>

          <!-- Score block -->
          <tr>
            <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:32px;">
              <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);">
                ${trade} · ${city}
              </p>
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;">
                ${businessName}
              </h1>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:20px;">
                    <p style="margin:0;font-size:52px;font-weight:700;color:${scoreColor};font-family:'Courier New',monospace;line-height:1;">
                      ${overallScore}<span style="font-size:22px;color:rgba(255,255,255,0.3)">/10</span>
                    </p>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 4px;font-size:18px;font-weight:600;color:#ffffff;">${scoreBucket}</p>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);">Overall SEO Score</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 0 24px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:rgba(255,255,255,0.75);">
                I went through every section — GBP, reviews, citations, backlinks,
                and your on-page setup. The area holding you back the most right now
                is <strong style="color:#ffffff;">${lowestLabel}</strong>.
                That's where I'd start.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.55);">
                Your full breakdown is below — every section scored, every gap
                identified, with a specific next step for each one.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${auditUrl}"
                style="display:inline-block;background:#7bafd4;color:#020203;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;padding:14px 28px;">
                View Your Full Audit →
              </a>
            </td>
          </tr>

          <!-- Book call -->
          <tr>
            <td style="background:rgba(123,175,212,0.05);border:1px solid rgba(123,175,212,0.14);border-radius:10px;padding:24px;">
              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#ffffff;">
                Ready to fix what's holding you back?
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.5);">
                Start a 14-day free trial of the full toolkit — GBP optimizer,
                citation tracker, geo-grid Map Pack rankings, and the rest of
                the eight tools that map to every section in your audit.
                $49/mo after the trial. Cancel anytime.
              </p>
              <a href="${signupUrl}"
                style="display:inline-block;background:#7bafd4;color:#020203;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;padding:11px 22px;margin-bottom:14px;">
                Start Free 14-Day Trial →
              </a>
              <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.4);">
                Prefer to talk it through first?
                <a href="${calendlyUrl}" style="color:#7bafd4;text-decoration:none;">Book a free 20-min call</a>
                — no pitch, just the plan.
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.25);">
                <a href="${pricingUrl}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">See full pricing</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6;">
                Local Search Ally · 707 West Jillian Street, Siloam Springs AR 72761<br/>
                You received this because you ran a free audit at localsearchally.com.<br/>
                <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Shared email shell ────────────────────────────────────────────────────────

function twoPathCta({
  primaryUrl,
  primaryLabel,
  calendlyUrl,
}: {
  primaryUrl: string;
  primaryLabel: string;
  calendlyUrl: string;
}): string {
  return `
        <a href="${primaryUrl}"
          style="display:inline-block;background:#7bafd4;color:#020203;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;padding:14px 28px;">
          ${primaryLabel} →
        </a>
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.4);">
          Prefer to talk it through first?
          <a href="${calendlyUrl}" style="color:#7bafd4;text-decoration:none;">Book a free 20-min call</a>.
        </p>
  `;
}

function emailShell(bodyHtml: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body bgcolor="#020203" style="margin:0;padding:0;background:#020203;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#020203" style="background:#020203;">
    <tr>
      <td align="center" bgcolor="#020203" style="padding:40px 16px;background:#020203;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#7bafd4;font-weight:600;">Local Search Ally</p>
            </td>
          </tr>
          ${bodyHtml}
          <tr>
            <td style="padding-top:32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6;">
                Local Search Ally · 707 West Jillian Street, Siloam Springs AR 72761<br/>
                You received this because you ran a free audit at localsearchally.com.<br/>
                <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Day 2: Quick win ─────────────────────────────────────────────────────────

function buildDripDay2Html({
  businessName,
  lowestLabel,
  lowestToolUrl,
  signupUrl,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  lowestLabel: string;
  lowestToolUrl: string;
  signupUrl: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          Quick follow-up on the audit for <strong style="color:#ffffff;">${businessName}</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          The section that scored lowest was <strong style="color:#ffffff;">${lowestLabel}</strong>.
          Of everything in your audit, fixing that one thing will have the most
          immediate impact on how often you show up when someone searches for what
          you do in your area.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          There's a tool inside Local Search Ally built specifically for this —
          it walks you through the exact fixes for your ${lowestLabel.toLowerCase()}
          gaps step by step. You can
          <a href="${lowestToolUrl}" style="color:#7bafd4;text-decoration:none;">see what it does here</a>,
          or start a 14-day free trial and just use it.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          $49/mo after the trial. Cancel anytime. No card needed to start
          looking around.
        </p>
        ${twoPathCta({
          primaryUrl: signupUrl,
          primaryLabel: "Start Free 14-Day Trial",
          calendlyUrl,
        })}
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}

// ─── Day 5: Why the Map Pack matters ─────────────────────────────────────────

const TRADE_STATS: Record<string, string> = {
  HVAC: "HVAC contractors in the Google Map Pack receive roughly 3× more calls than those ranking below it. (BrightLocal)",
  Plumbing:
    "Plumbers in the Map Pack get about 2.7× more quote requests than those on page 2. (BrightLocal)",
  Electrical:
    "Electricians ranking in the top 3 local results capture roughly 68% of all local-service clicks. (BrightLocal)",
  Roofing:
    "Roofing contractors in the Map Pack close around 40% more storm-season leads than unlisted competitors. (BrightLocal)",
  Landscaping:
    "Landscaping companies in the top 3 local spots get roughly 3× more seasonal inquiries. (BrightLocal)",
  Remodeling:
    "Remodelers with complete GBP profiles receive up to 520% more direction requests than incomplete listings. (Google)",
  "General Contracting":
    "General contractors listed in the Map Pack receive roughly 2.8× more project quote requests. (BrightLocal)",
  Other:
    "Local service businesses in the Google Map Pack receive on average ~2.5× more calls than those outside it. (BrightLocal)",
};

function buildDripDay5Html({
  businessName,
  trade,
  signupUrl,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  trade: string;
  signupUrl: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  const stat = TRADE_STATS[trade] ?? TRADE_STATS["Other"];
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          Here's a stat I share with almost every ${trade.toLowerCase()} contractor I work with:
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
          <tr>
            <td style="background:rgba(123,175,212,0.07);border-left:3px solid #7bafd4;border-radius:4px;padding:18px 20px;">
              <p style="margin:0;font-size:15px;line-height:1.65;color:#ffffff;font-style:italic;">
                "${stat}"
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          That gap between Map Pack and page 2 isn't luck. The contractors at the top
          did a few specific things right — and most of them aren't things you'd
          figure out on your own.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          The audit I ran for <strong style="color:#ffffff;">${businessName}</strong>
          shows what's keeping you out of that top 3. The toolkit shows where you
          actually rank — there's a geo-grid Map Pack tracker that scans your
          rankings across your whole service area so you know exactly which
          neighborhoods you're winning and which you're losing.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          Try it free for 14 days and see your grid.
        </p>
        ${twoPathCta({
          primaryUrl: signupUrl,
          primaryLabel: "Start Free 14-Day Trial",
          calendlyUrl,
        })}
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}

// ─── Day 9: Social proof ──────────────────────────────────────────────────────

function buildDripDay9Html({
  businessName,
  trade,
  signupUrl,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  trade: string;
  signupUrl: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          A story worth sharing.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          A ${trade.toLowerCase()} contractor came to me a while back with an audit
          score a lot like yours. They were showing up on page 2, sometimes page 3.
          Calls were inconsistent. They couldn't figure out why competitors were
          ranking above them despite having more reviews.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          We fixed three specific things — their <strong style="color:#ffffff;">GBP setup</strong>,
          <strong style="color:#ffffff;">citation consistency</strong>, and a couple of
          <strong style="color:#ffffff;">on-page issues</strong>. Six weeks later
          they were in the Map Pack for their top keyword.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          Those three things are three of the eight tools inside Local Search Ally.
          You can work through them yourself in the dashboard, or have me walk
          you through which one to start with.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          The audit for <strong style="color:#ffffff;">${businessName}</strong>
          already shows the gaps. The toolkit is how you close them.
        </p>
        ${twoPathCta({
          primaryUrl: signupUrl,
          primaryLabel: "Start Free 14-Day Trial",
          calendlyUrl,
        })}
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}

// ─── Day 14: Objection handler ────────────────────────────────────────────────

function buildDripDay14Html({
  trade,
  signupUrl,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  trade: string;
  signupUrl: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          I hear this from ${trade.toLowerCase()} contractors a lot: <em style="color:#ffffff;">"I've tried
          SEO before and it didn't work."</em>
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          That's almost always because the agency was optimizing for the wrong thing.
          Most SEO shops focus on general search rankings — blog posts, keyword pages,
          link building. Those things matter for national brands. They're largely
          irrelevant for a local contractor trying to get more calls.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          Local SEO for service contractors is a different discipline. It's your
          Google Business Profile, citation consistency, review signals, and
          hyperlocal on-page signals. That's where Map Pack rankings come from.
          That's what every tool in Local Search Ally is built around.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          And if you've been burned before — you don't have to take my word for it.
          $49/mo, 14 days free, cancel from your dashboard in two clicks.
          Or hop on a 20-minute call first if that feels safer.
        </p>
        ${twoPathCta({
          primaryUrl: signupUrl,
          primaryLabel: "Start Free 14-Day Trial",
          calendlyUrl,
        })}
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}

// ─── Day 21: Last touch ───────────────────────────────────────────────────────

function buildDripDay21Html({
  businessName,
  trade,
  signupUrl,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  trade: string;
  signupUrl: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          Last one from me — I mean it this time.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          Running a ${trade.toLowerCase()} business doesn't leave a lot of room for
          marketing projects. I get it. If the timing hasn't been right,
          no explanation needed.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          The audit results for <strong style="color:#ffffff;">${businessName}</strong>
          don't expire. When you're ready, you can re-run a fresh audit anytime,
          start a free trial of the toolkit, or just book a call.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          And if you'd rather I leave you alone — unsubscribe below, no hard feelings.
        </p>
        ${twoPathCta({
          primaryUrl: signupUrl,
          primaryLabel: "Start Free 14-Day Trial",
          calendlyUrl,
        })}
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}

function buildReauditReminderHtml({
  businessName,
  trade,
  city,
  siteUrl,
  dashboardUrl,
  signupUrl,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  trade: string;
  city: string;
  siteUrl: string;
  dashboardUrl: string;
  signupUrl: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  const auditToolUrl = `${siteUrl}/?business=${encodeURIComponent(businessName)}&city=${encodeURIComponent(city)}&trade=${encodeURIComponent(trade)}`;
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          It's been 30 days since we ran your free local SEO audit for
          <strong style="color:#ffffff;">${businessName}</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          A month is enough time for things to shift — Google updates profiles,
          competitors move, and any work you've done on citations or reviews
          should show up in a new score. Your free audit refreshes today.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          Run it again and see what changed. It only takes 90 seconds.
        </p>
        <a href="${auditToolUrl}"
          style="display:inline-block;background:#7bafd4;color:#020203;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;padding:14px 32px;">
          Re-Run My Free Audit →
        </a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.4);">
          Already inside the toolkit?
          <a href="${dashboardUrl}" style="color:#7bafd4;text-decoration:none;">Open your dashboard</a>
          to re-run from there and see your score history.
        </p>
        <p style="margin:8px 0 0;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.4);">
          New here?
          <a href="${signupUrl}" style="color:#7bafd4;text-decoration:none;">Start a 14-day free trial</a>
          to track every audit over time — or
          <a href="${calendlyUrl}" style="color:#7bafd4;text-decoration:none;">book a strategy call</a>.
        </p>
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}
