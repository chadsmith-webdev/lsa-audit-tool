// ─── Website on-page prefetch functions ──────────────────────────────────────

export interface WebsiteData {
  title?: string;
  metaDescription?: string;
  h1?: string;
  h2s: string[];
  hasLocalBusinessSchema: boolean;
  schemaTypes: string[];
  schemaPresentFields: string[];
  schemaMissingFields: string[];
  isHttps: boolean;
  hasSitemap: boolean;
  fetchError?: string;
}

const LOCAL_BUSINESS_TYPES = new Set([
  "LocalBusiness",
  "Plumber",
  "HVACBusiness",
  "Electrician",
  "RoofingContractor",
  "GeneralContractor",
  "HomeAndConstructionBusiness",
  "LandscapingBusiness",
  "ProfessionalService",
]);

const SCHEMA_FIELDS = [
  "name",
  "address",
  "telephone",
  "serviceArea",
  "openingHours",
  "areaServed",
];

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type JsonLdBlock = Record<string, unknown>;

function extractJsonLdBlocks(html: string): JsonLdBlock[] {
  const blocks: JsonLdBlock[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    try {
      const parsed: unknown = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        blocks.push(...(parsed as JsonLdBlock[]));
      } else if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as JsonLdBlock)["@graph"])
      ) {
        blocks.push(...((parsed as JsonLdBlock)["@graph"] as JsonLdBlock[]));
      } else if (parsed && typeof parsed === "object") {
        blocks.push(parsed as JsonLdBlock);
      }
    } catch {
      /* skip malformed */
    }
  }
  return blocks;
}

export async function fetchWebsiteData(
  websiteUrl: string,
): Promise<WebsiteData> {
  const isHttps = websiteUrl.startsWith("https://");

  let html = "";
  try {
    const res = await fetch(websiteUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LSAAuditBot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return {
        h2s: [],
        hasLocalBusinessSchema: false,
        schemaTypes: [],
        schemaPresentFields: [],
        schemaMissingFields: SCHEMA_FIELDS,
        isHttps,
        hasSitemap: false,
        fetchError: `HTTP ${res.status}`,
      };
    }
    const full = await res.text();
    html = full.slice(0, 250_000); // 250KB covers <head> on any real site
  } catch (err) {
    return {
      h2s: [],
      hasLocalBusinessSchema: false,
      schemaTypes: [],
      schemaPresentFields: [],
      schemaMissingFields: SCHEMA_FIELDS,
      isHttps,
      hasSitemap: false,
      fetchError: err instanceof Error ? err.message : String(err),
    };
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  // Meta description
  const metaMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    );
  const metaDescription = metaMatch ? metaMatch[1].trim() : undefined;

  // H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? stripTags(h1Match[1]) : undefined;

  // H2s (first 6)
  const h2s: string[] = [];
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let h2Match: RegExpExecArray | null;
  while ((h2Match = h2Re.exec(html)) !== null && h2s.length < 6) {
    const text = stripTags(h2Match[1]);
    if (text) h2s.push(text);
  }

  // JSON-LD schema
  const blocks = extractJsonLdBlocks(html);
  const localBizBlocks = blocks.filter((b) => {
    const t = b["@type"];
    return typeof t === "string" && LOCAL_BUSINESS_TYPES.has(t);
  });
  const hasLocalBusinessSchema = localBizBlocks.length > 0;
  const schemaTypes = Array.from(
    new Set(
      localBizBlocks
        .map((b) => b["@type"])
        .filter((t): t is string => typeof t === "string"),
    ),
  );

  const schemaPresentFields: string[] = [];
  const schemaMissingFields: string[] = [];
  if (hasLocalBusinessSchema) {
    const merged = Object.assign({}, ...localBizBlocks);
    for (const field of SCHEMA_FIELDS) {
      (merged[field] ? schemaPresentFields : schemaMissingFields).push(field);
    }
  } else {
    schemaMissingFields.push(...SCHEMA_FIELDS);
  }

  // Sitemap
  let hasSitemap = false;
  try {
    const origin = new URL(websiteUrl).origin;
    const sitemapRes = await fetch(`${origin}/sitemap.xml`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5_000),
      redirect: "follow",
    });
    hasSitemap = sitemapRes.ok;
  } catch {
    /* ignore */
  }

  return {
    title,
    metaDescription,
    h1,
    h2s,
    hasLocalBusinessSchema,
    schemaTypes,
    schemaPresentFields,
    schemaMissingFields,
    isHttps,
    hasSitemap,
  };
}

export function formatWebsiteBlock(site: WebsiteData): string {
  if (site.fetchError) {
    return `ONPAGE_DATA: Could not fetch website (${site.fetchError}) — use web search for on-page signals.`;
  }

  const schemaLine = site.hasLocalBusinessSchema
    ? `YES — type: ${site.schemaTypes.join(", ")}${site.schemaPresentFields.length ? `, fields present: ${site.schemaPresentFields.join(", ")}` : ""}${site.schemaMissingFields.length ? `, fields MISSING: ${site.schemaMissingFields.join(", ")}` : ""}`
    : "NO — no LocalBusiness schema found";

  return `ONPAGE_DATA (fetched directly from the website):
  Title tag: ${site.title ?? "not found"}
  Meta description: ${site.metaDescription ?? "not found"}
  H1: ${site.h1 ?? "not found"}
  H2s: ${site.h2s.length ? site.h2s.join(" | ") : "none found"}
  HTTPS: ${site.isHttps ? "YES" : "NO"}
  Sitemap.xml: ${site.hasSitemap ? "YES" : "NO"}
  LocalBusiness schema: ${schemaLine}`;
}
