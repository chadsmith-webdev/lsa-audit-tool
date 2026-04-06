import { Resend } from "resend";

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

export async function POST(req: Request) {
  let body: EmailPayload;
  try {
    body = await req.json();
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
    process.env.CALENDLY_URL ?? "https://calendly.com/localse archally";
  const auditUrl = auditId ? `${siteUrl}/audit/${auditId}` : siteUrl;
  const lowestLabel = SECTION_LABELS[lowestSection] ?? lowestSection;

  const resend = new Resend(resendKey);

  // ── Send confirmation email ──────────────────────────────────────────────
  const { error: sendError } = await resend.emails.send({
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
    }),
  });

  if (sendError) {
    console.error("Resend error:", sendError);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }

  // ── Slack notification (non-blocking) ───────────────────────────────────
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    fetch(slackWebhook, {
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
    }).catch((err) => console.error("Slack notify failed:", err));
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
}: {
  businessName: string;
  trade: string;
  city: string;
  scoreBucket: string;
  overallScore: number;
  lowestLabel: string;
  auditUrl: string;
  calendlyUrl: string;
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
            <td style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6;">
                Local Search Ally · NWA Local SEO for Contractors<br/>
                You received this because you ran a free audit at localsearchally.com.
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
