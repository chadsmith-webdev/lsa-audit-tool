import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { AuditPdf } from "@/lib/AuditPdf";
import { getSupabase } from "@/lib/supabase";

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

const SECTION_LABELS: Record<string, string> = {
  gbp: "Google Business Profile",
  reviews: "Reviews",
  onpage: "On-Page SEO",
  technical: "Technical SEO",
  citations: "Citations",
  backlinks: "Backlinks",
  competitors: "Competitor Comparison",
};

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
    process.env.CALENDY_URL ??
    "https://calendly.com/localsearchally";
  const auditUrl = auditId ? `${siteUrl}/audit/${auditId}` : siteUrl;
  const lowestLabel = SECTION_LABELS[lowestSection] ?? lowestSection;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfElement = createElement(AuditPdf, {
          result: auditRow.result,
          trade,
          city,
          calendlyUrl,
        }) as any;
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
    await resend.emails.send({
      from: "Local Search Ally <audits@localsearchally.com>",
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
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
      headers: {
        "List-Unsubscribe": `<${unsubscribeMailto}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      ...(pdfAttachment ? { attachments: [pdfAttachment] } : {}),
    });
  } catch (err: any) {
    console.error("Resend error:", err);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
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
      from: "Local Search Ally <audits@localsearchally.com>",
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
        unsubscribed: false,
      })
      .catch((err) => console.error("Resend contact create failed:", err));
  }

  // ── Schedule drip sequence (non-blocking) ───────────────────────────────
  const drips = [
    {
      daysOut: 2,
      subject: `One thing to fix first — ${businessName}`,
      html: buildDripDay2Html({
        businessName,
        lowestLabel,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
    },
    {
      daysOut: 5,
      subject: `What ${trade} contractors in the Map Pack do differently`,
      html: buildDripDay5Html({
        businessName,
        trade,
        calendlyUrl,
        unsubscribeUrl: unsubscribeMailto,
      }),
    },
    {
      daysOut: 10,
      subject: `Last note from Local Search Ally`,
      html: buildDripDay10Html({
        businessName,
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
        from: "Local Search Ally <audits@localsearchally.com>",
        to: email,
        subject: drip.subject,
        html: drip.html,
        scheduledAt,
        headers: {
          "List-Unsubscribe": `<${unsubscribeMailto}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
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
<body style="margin:0;padding:0;background:#020203;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020203;">
    <tr>
      <td align="center" style="padding:40px 16px;">
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
                Your full audit is ready. The biggest gap I found was in
                <strong style="color:#ffffff;">${lowestLabel}</strong> — that's
                worth fixing first.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.55);">
                Click below to see the complete breakdown with every section score,
                finding, and a specific next step for each one.
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
                Want to walk through it together?
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.5);">
                I'll show you exactly what to fix first and what to skip.
                Takes about 20 minutes.
              </p>
              <a href="${calendlyUrl}"
                style="display:inline-block;background:transparent;color:#7bafd4;font-size:14px;font-weight:600;text-decoration:none;border:1px solid rgba(123,175,212,0.35);border-radius:6px;padding:10px 20px;">
                Book a Free Call →
              </a>
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

function emailShell(bodyHtml: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#020203;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020203;">
    <tr>
      <td align="center" style="padding:40px 16px;">
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

// ─── Day 2: Specific finding ───────────────────────────────────────────────────

function buildDripDay2Html({
  businessName,
  lowestLabel,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  lowestLabel: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          Wanted to follow up on your audit for <strong style="color:#ffffff;">${businessName}</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          The biggest gap I flagged was in <strong style="color:#ffffff;">${lowestLabel}</strong>.
          That's the one issue that, if fixed, will have the most immediate impact on
          how often you show up when someone in your area searches for what you do.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          Takes about 20 minutes to fix. Want to do it together?
        </p>
        <a href="${calendlyUrl}"
          style="display:inline-block;background:#7bafd4;color:#020203;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;padding:14px 28px;">
          Book a Free 20-Min Call →
        </a>
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}

// ─── Day 5: Industry data ──────────────────────────────────────────────────────

const TRADE_STATS: Record<string, string> = {
  HVAC: "HVAC contractors in the Google Map Pack receive 3× more calls than those ranking below it — BrightLocal, 2024.",
  Plumbing:
    "Plumbers in the Map Pack get 2.7× more quote requests than those on page 2 — BrightLocal, 2024.",
  Electrical:
    "Electricians ranking in the top 3 local results capture 68% of all local service clicks — BrightLocal, 2024.",
  Roofing:
    "Roofing contractors in the Map Pack close 40% more storm-season leads than unlisted competitors — BrightLocal, 2024.",
  Landscaping:
    "Landscaping companies in the top 3 local spots get 3× more seasonal inquiry volume — BrightLocal, 2024.",
  Remodeling:
    "Remodelers with complete GBP profiles get 520% more direction requests than incomplete listings — Google, 2024.",
  "General Contracting":
    "General contractors listed in the Map Pack receive 2.8× more project quote requests — BrightLocal, 2024.",
  Other:
    "Local service businesses in the Google Map Pack receive on average 2.5× more calls than those outside it — BrightLocal, 2024.",
};

function buildDripDay5Html({
  businessName,
  trade,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  trade: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  const stat = TRADE_STATS[trade] ?? TRADE_STATS["Other"];
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          One stat I keep coming back to when I work with ${trade.toLowerCase()} contractors:
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
          The audit I ran for <strong style="color:#ffffff;">${businessName}</strong> shows
          exactly what's keeping you out of that top 3. The fixes aren't complicated —
          they're just specific.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          If you want to talk through what to prioritize, I have time this week.
        </p>
        <a href="${calendlyUrl}"
          style="display:inline-block;background:#7bafd4;color:#020203;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;padding:14px 28px;">
          Book a Free Strategy Call →
        </a>
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}

// ─── Day 10: Last touch ────────────────────────────────────────────────────────

function buildDripDay10Html({
  businessName,
  calendlyUrl,
  unsubscribeUrl,
}: {
  businessName: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
}): string {
  return emailShell(
    `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.8);">
          Last note — I promise.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          If now's not the right time for <strong style="color:#ffffff;">${businessName}</strong>,
          no worries at all. Local SEO isn't going anywhere — whenever you're ready,
          the audit will still be there.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.65);">
          And if you do want to talk through it: I'm easy to reach.
        </p>
        <a href="${calendlyUrl}"
          style="display:inline-block;background:transparent;color:#7bafd4;font-size:15px;font-weight:600;text-decoration:none;border:1px solid rgba(123,175,212,0.35);border-radius:8px;padding:13px 28px;">
          ${calendlyUrl.replace("https://", "")} →
        </a>
      </td>
    </tr>
  `,
    unsubscribeUrl,
  );
}
