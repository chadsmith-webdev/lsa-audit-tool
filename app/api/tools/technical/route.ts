import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { proGateApi } from "@/lib/require-pro";

/**
 * POST /api/tools/technical
 *
 * Body: { auditId: string, url?: string }
 *
 * Runs a fresh, on-demand technical scan of the user's website and returns
 * a pass/fail checklist with measured timings and AI-generated fix guidance
 * for any failures.
 */

type AnthropicContentBlock = { type: string; text?: string };

type Check = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type ScanResult = {
  url: string;
  fetchedAt: string;
  responseTimeMs: number | null;
  httpStatus: number | null;
  htmlBytes: number | null;
  checks: Check[];
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

  let body: { auditId?: string; url?: string };
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
    .select("id, business_name, trade, user_id, input")
    .eq("id", auditId)
    .single();
  if (auditErr || !audit || audit.user_id !== user.id) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  const inputObj =
    audit.input && typeof audit.input === "object"
      ? (audit.input as { websiteUrl?: string })
      : null;
  const url =
    (typeof body.url === "string" ? body.url.trim() : "") ||
    inputObj?.websiteUrl ||
    "";
  if (!url) {
    return NextResponse.json(
      { error: "No website on file. Provide a URL." },
      { status: 400 },
    );
  }

  const scan = await runScan(url);

  let guidance: Record<string, string> = {};
  const failed = scan.checks.filter((c) => c.status !== "pass");
  if (failed.length > 0) {
    guidance = await generateGuidance({
      url,
      trade: audit.trade,
      failures: failed,
    });
  }

  return NextResponse.json({ scan, guidance });
}

async function runScan(url: string): Promise<ScanResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      url,
      fetchedAt: new Date().toISOString(),
      responseTimeMs: null,
      httpStatus: null,
      htmlBytes: null,
      checks: [
        {
          id: "url-valid",
          label: "URL is valid",
          status: "fail",
          detail: "The website URL on this audit isn't parseable.",
        },
      ],
    };
  }

  const checks: Check[] = [];
  let html = "";
  let httpStatus: number | null = null;
  let responseTimeMs: number | null = null;
  let htmlBytes: number | null = null;
  let headers: Headers | null = null;

  const start = Date.now();
  try {
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LSAAuditBot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    responseTimeMs = Date.now() - start;
    httpStatus = res.status;
    headers = res.headers;
    html = await res.text();
    htmlBytes = html.length;
  } catch (err) {
    return {
      url,
      fetchedAt: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      httpStatus: null,
      htmlBytes: null,
      checks: [
        {
          id: "reachable",
          label: "Site is reachable",
          status: "fail",
          detail: `Could not fetch the site: ${err instanceof Error ? err.message : "unknown error"}`,
        },
      ],
    };
  }

  // HTTPS
  checks.push({
    id: "https",
    label: "Serves over HTTPS",
    status: parsed.protocol === "https:" ? "pass" : "fail",
    detail:
      parsed.protocol === "https:"
        ? "Secure connection in place."
        : "Site is on HTTP. Browsers flag this as 'Not secure' and Google penalizes it.",
  });

  // HTTP 200
  checks.push({
    id: "http-200",
    label: "Returns HTTP 200",
    status: httpStatus === 200 ? "pass" : "fail",
    detail:
      httpStatus === 200
        ? "Homepage responds 200 OK."
        : `Homepage returned HTTP ${httpStatus}. Search engines may stop crawling.`,
  });

  // Response time
  if (responseTimeMs !== null) {
    const fast = responseTimeMs <= 1500;
    const ok = responseTimeMs <= 3000;
    checks.push({
      id: "response-time",
      label: "Server response under 1.5s",
      status: fast ? "pass" : ok ? "warn" : "fail",
      detail: `${responseTimeMs} ms. ${
        fast
          ? "Fast first byte."
          : ok
            ? "Acceptable but slower than the 1.5s target."
            : "Too slow. Mobile visitors and Google both penalize this."
      }`,
    });
  }

  // Page weight
  if (htmlBytes !== null) {
    const kb = Math.round(htmlBytes / 1024);
    const ok = kb <= 250;
    const warn = kb <= 500;
    checks.push({
      id: "page-weight",
      label: "HTML payload under 250 KB",
      status: ok ? "pass" : warn ? "warn" : "fail",
      detail: `${kb} KB of HTML. ${
        ok
          ? "Lean payload."
          : warn
            ? "Heavier than ideal. Look for inline scripts or repeated markup."
            : "Heavy HTML payload. Likely loading too much inline content."
      }`,
    });
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  checks.push({
    id: "title",
    label: "Has a page title",
    status: title ? "pass" : "fail",
    detail: title
      ? `Title: "${title.slice(0, 80)}${title.length > 80 ? "…" : ""}"`
      : "Missing <title> tag. This is the single biggest on-page SEO element.",
  });

  // Meta description
  const metaMatch = html.match(
    /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
  );
  const metaContent = metaMatch ? metaMatch[1].trim() : "";
  checks.push({
    id: "meta-description",
    label: "Has a meta description",
    status: metaContent ? "pass" : "fail",
    detail: metaContent
      ? `Meta description is ${metaContent.length} chars.`
      : "No meta description. Google will write one for you, usually badly.",
  });

  // Viewport
  const viewportPresent = /<meta\s+[^>]*name=["']viewport["']/i.test(html);
  checks.push({
    id: "viewport",
    label: "Mobile viewport set",
    status: viewportPresent ? "pass" : "fail",
    detail: viewportPresent
      ? "Mobile viewport meta is present."
      : "Missing viewport meta. The page renders desktop-width on phones.",
  });

  // H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "";
  checks.push({
    id: "h1",
    label: "Has a visible H1",
    status: h1Text ? "pass" : "fail",
    detail: h1Text
      ? `H1: "${h1Text.slice(0, 80)}${h1Text.length > 80 ? "…" : ""}"`
      : "No H1 found. The page has no clear top-level heading.",
  });

  // Schema (JSON-LD presence)
  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(
    html,
  );
  checks.push({
    id: "schema",
    label: "Has structured data (JSON-LD)",
    status: hasJsonLd ? "pass" : "warn",
    detail: hasJsonLd
      ? "JSON-LD block detected."
      : "No JSON-LD found. Add LocalBusiness schema so Google can read your hours, phone, and area served.",
  });

  // Noindex
  const noindex =
    /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(
      html,
    );
  checks.push({
    id: "noindex",
    label: "Page is indexable",
    status: noindex ? "fail" : "pass",
    detail: noindex
      ? "Homepage is set to noindex. Google will not list it in search results."
      : "No noindex directive on the homepage.",
  });

  // robots.txt
  try {
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
    const r = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5_000),
    });
    checks.push({
      id: "robots",
      label: "robots.txt present",
      status: r.ok ? "pass" : "warn",
      detail: r.ok
        ? "robots.txt found."
        : `No robots.txt at /robots.txt (HTTP ${r.status}). Not required, but recommended.`,
    });
  } catch {
    checks.push({
      id: "robots",
      label: "robots.txt present",
      status: "warn",
      detail: "Could not reach /robots.txt.",
    });
  }

  // sitemap.xml
  try {
    const sitemapUrl = `${parsed.protocol}//${parsed.host}/sitemap.xml`;
    const s = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(5_000),
    });
    checks.push({
      id: "sitemap",
      label: "sitemap.xml present",
      status: s.ok ? "pass" : "warn",
      detail: s.ok
        ? "sitemap.xml found."
        : `No sitemap.xml (HTTP ${s.status}). Submit one in Google Search Console.`,
    });
  } catch {
    checks.push({
      id: "sitemap",
      label: "sitemap.xml present",
      status: "warn",
      detail: "Could not reach /sitemap.xml.",
    });
  }

  // Security headers (optional, warn-only)
  const csp = headers?.get("content-security-policy");
  const hsts = headers?.get("strict-transport-security");
  const securityScore = [csp, hsts].filter(Boolean).length;
  checks.push({
    id: "security-headers",
    label: "Security headers configured",
    status: securityScore >= 1 ? "pass" : "warn",
    detail:
      securityScore >= 1
        ? `Detected: ${[csp && "CSP", hsts && "HSTS"].filter(Boolean).join(", ")}.`
        : "No CSP or HSTS header detected. Not an SEO killer, but worth adding.",
  });

  return {
    url: parsed.toString(),
    fetchedAt: new Date().toISOString(),
    responseTimeMs,
    httpStatus,
    htmlBytes,
    checks,
  };
}

async function generateGuidance(args: {
  url: string;
  trade: string;
  failures: Check[];
}): Promise<Record<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return {};

  const list = args.failures
    .map((f) => `- ${f.id} (${f.status}): ${f.label} — ${f.detail}`)
    .join("\n");

  const prompt = `A local ${args.trade} contractor's website (${args.url}) failed these technical checks:

${list}

For each failed check, write a one-paragraph fix in plain language (50-90 words). Speak to a small business owner, not a developer. Where a developer task is required, say "ask your web person to ..." and describe the change in concrete terms. No fluff phrases.

Return ONLY valid JSON in this shape:

{
  "check-id-1": "Fix paragraph...",
  "check-id-2": "Fix paragraph..."
}

Use the exact check ids from above as keys.`;

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
          "You are a technical SEO consultant for small contractors. You write plain-English fix instructions. No jargon, no fluff, 8th-grade reading level. You return only valid JSON.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1400,
        temperature: 0.3,
      }),
    });
    if (!response.ok) return {};
    const data = (await response.json()) as {
      content: AnthropicContentBlock[];
    };
    const textBlock = data.content.filter((b) => b.type === "text").pop();
    if (!textBlock?.text) return {};
    const cleaned = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
  } catch (err) {
    console.error("Guidance generation failed:", err);
  }
  return {};
}
