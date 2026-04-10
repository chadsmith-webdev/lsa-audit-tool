export interface GBPData {
  found: boolean;
  name?: string;
  rating?: number;
  reviewCount?: number;
  photoCount?: number;
  hasHours?: boolean;
  phone?: string;
  address?: string;
}

export interface PageSpeedData {
  lcp?: number; // seconds
  inp?: number; // milliseconds
  cls?: number;
  mobileScore?: number;
  fetchError?: string;
}

export async function fetchGBPData(
  businessName: string,
  city: string,
): Promise<GBPData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { found: false };

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.rating",
            "places.userRatingCount",
            "places.regularOpeningHours",
            "places.photos",
            "places.nationalPhoneNumber",
            "places.formattedAddress",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery: `${businessName} ${city}`,
          maxResultCount: 1,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) return { found: false };
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return { found: false };

    const rawPhotoCount = place.photos?.length ?? 0;
    // Places API (New) caps photo array at 10 — flag as "10+" if at limit
    const photoCount = rawPhotoCount >= 10 ? 10 : rawPhotoCount;
    const photoAtCap = rawPhotoCount >= 10;

    return {
      found: true,
      name: place.displayName?.text,
      rating: place.rating,
      reviewCount: place.userRatingCount,
      photoCount,
      hasHours: !!place.regularOpeningHours,
      phone: place.nationalPhoneNumber,
      address: place.formattedAddress,
      ...(photoAtCap ? { photoAtCap: true } : {}),
    } as GBPData & { photoAtCap?: boolean };
  } catch {
    return { found: false };
  }
}

export async function fetchPageSpeedData(
  websiteUrl: string,
): Promise<PageSpeedData> {
  try {
    const apiUrl = new URL(
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
    );
    apiUrl.searchParams.set("url", websiteUrl);
    apiUrl.searchParams.set("strategy", "mobile");

    const res = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) return { fetchError: `HTTP ${res.status}` };

    const data = await res.json();

    // Prefer field data (real users), fall back to Lighthouse lab data
    const metrics = data.loadingExperience?.metrics;
    const audits = data.lighthouseResult?.audits;

    const lcp = (() => {
      const field = metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile;
      if (field) return field / 1000;
      const lab = audits?.["largest-contentful-paint"]?.numericValue;
      return lab ? lab / 1000 : undefined;
    })();

    const inp = (() => {
      const field = metrics?.INTERACTION_TO_NEXT_PAINT?.percentile;
      if (field) return field;
      return audits?.["interaction-to-next-paint"]?.numericValue;
    })();

    const cls = (() => {
      const field = metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile;
      if (field) return field / 100;
      return audits?.["cumulative-layout-shift"]?.numericValue;
    })();

    const mobileScore = data.lighthouseResult?.categories?.performance?.score
      ? Math.round(data.lighthouseResult.categories.performance.score * 100)
      : undefined;

    return { lcp, inp, cls, mobileScore };
  } catch (err: any) {
    return { fetchError: err.message };
  }
}

export function formatGBPBlock(gbp: GBPData): string {
  if (!gbp.found) {
    return "GBP_EXISTS: NO — no Google Business Profile found for this business name and city. Score the gbp section as red (1–3).";
  }

  const photoAtCap = (gbp as any).photoAtCap;
  const photoStr = photoAtCap
    ? "10+ (API maximum returned)"
    : `${gbp.photoCount ?? "unknown"} ${(gbp.photoCount ?? 0) < 10 ? "— CRITICAL: under 10 photos" : ""}`;

  return `GBP_EXISTS: YES
  Name on GBP: ${gbp.name ?? "unknown"}
  Rating: ${gbp.rating ?? "unknown"}/5
  Review count: ${gbp.reviewCount ?? "unknown"}
  Photo count: ${photoStr}
  Business hours set: ${gbp.hasHours ? "YES" : "NO — missing hours hurts ranking"}
  Phone: ${gbp.phone ?? "not listed"}
  Address: ${gbp.address ?? "not listed"}`;
}

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
  "LocalBusiness", "Plumber", "HVACBusiness", "Electrician",
  "RoofingContractor", "GeneralContractor", "HomeAndConstructionBusiness",
  "LandscapingBusiness", "ProfessionalService",
]);

const SCHEMA_FIELDS = ["name", "address", "telephone", "serviceArea", "openingHours", "areaServed"];

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function extractJsonLdBlocks(html: string): any[] {
  const blocks: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else if (parsed["@graph"]) blocks.push(...parsed["@graph"]);
      else blocks.push(parsed);
    } catch { /* skip malformed */ }
  }
  return blocks;
}

export async function fetchWebsiteData(websiteUrl: string): Promise<WebsiteData> {
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
        h2s: [], hasLocalBusinessSchema: false, schemaTypes: [],
        schemaPresentFields: [], schemaMissingFields: SCHEMA_FIELDS,
        isHttps, hasSitemap: false, fetchError: `HTTP ${res.status}`,
      };
    }
    const full = await res.text();
    html = full.slice(0, 250_000); // 250KB covers <head> on any real site
  } catch (err: any) {
    return {
      h2s: [], hasLocalBusinessSchema: false, schemaTypes: [],
      schemaPresentFields: [], schemaMissingFields: SCHEMA_FIELDS,
      isHttps, hasSitemap: false, fetchError: err.message,
    };
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  // Meta description
  const metaMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
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
  const localBizBlocks = blocks.filter((b) => LOCAL_BUSINESS_TYPES.has(b["@type"]));
  const hasLocalBusinessSchema = localBizBlocks.length > 0;
  const schemaTypes = [...new Set(localBizBlocks.map((b) => b["@type"]))];

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
  } catch { /* ignore */ }

  return {
    title, metaDescription, h1, h2s,
    hasLocalBusinessSchema, schemaTypes, schemaPresentFields, schemaMissingFields,
    isHttps, hasSitemap,
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

export interface SerperLocalResult {
  title: string;
  address?: string;
  rating?: number;
  ratingCount?: number;
  category?: string;
  phone?: string;
  website?: string;
}

export interface SerperData {
  results: SerperLocalResult[];
  fetchError?: string;
}

export async function fetchSerperData(
  trade: string,
  city: string,
): Promise<SerperData> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return { results: [], fetchError: "No API key" };

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: `${trade} ${city} AR`,
        gl: "us",
        num: 10,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return { results: [], fetchError: `HTTP ${res.status}` };

    const data = await res.json();
    const raw: any[] = data.localResults ?? data.places ?? [];

    const results: SerperLocalResult[] = raw.slice(0, 5).map((r: any) => ({
      title: r.title,
      address: r.address,
      rating: r.rating,
      ratingCount: r.ratingCount,
      category: r.category,
      phone: r.phone,
      website: r.website,
    }));

    return { results };
  } catch (err: any) {
    return { results: [], fetchError: err.message };
  }
}

export function formatSerperBlock(serper: SerperData): string {
  if (serper.fetchError) {
    return `MAP_PACK: Could not fetch (${serper.fetchError}) — use web search to find competitors.`;
  }
  if (!serper.results.length) {
    return "MAP_PACK: No local results returned — use web search to find competitors.";
  }

  const lines = serper.results.map((r, i) => {
    const rating = r.rating !== undefined ? `${r.rating}/5` : "no rating";
    const reviews = r.ratingCount !== undefined ? `${r.ratingCount} reviews` : "no review count";
    const site = r.website ? "has website" : "no website";
    return `  ${i + 1}. ${r.title} — ${rating}, ${reviews}, ${site}${r.address ? `, ${r.address}` : ""}`;
  });

  return `MAP_PACK (real Google results for this trade + city query):\n${lines.join("\n")}`;
}

export interface BacklinksData {
  domainRank?: number;
  referringDomains?: number;
  backlinks?: number;
  fetchError?: string;
}

export async function fetchBacklinksData(websiteUrl: string): Promise<BacklinksData> {
  const apiKey = process.env.DATAFORSEO_API_KEY;
  if (!apiKey) return { fetchError: "No API key" };

  let hostname: string;
  try {
    hostname = new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return { fetchError: "Invalid URL" };
  }

  try {
    const res = await fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify([{ target: hostname, include_subdomains: true }]),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return { fetchError: `HTTP ${res.status}` };
    const data = await res.json();
    const result = data?.tasks?.[0]?.result?.[0];
    if (!result) return { fetchError: "No result returned" };

    return {
      domainRank: result.rank,
      referringDomains: result.referring_domains,
      backlinks: result.backlinks,
    };
  } catch (err: any) {
    return { fetchError: err.message };
  }
}

export function formatBacklinksBlock(bl: BacklinksData): string {
  if (bl.fetchError) {
    return `BACKLINKS: Could not fetch (${bl.fetchError}) — use web search to estimate domain authority.`;
  }
  const rank = bl.domainRank !== undefined ? `${bl.domainRank}/100` : "unknown";
  const domains = bl.referringDomains !== undefined ? bl.referringDomains.toLocaleString() : "unknown";
  const links = bl.backlinks !== undefined ? bl.backlinks.toLocaleString() : "unknown";

  const rankNote =
    bl.domainRank === undefined ? "" :
    bl.domainRank >= 40 ? " — solid" :
    bl.domainRank >= 20 ? " — weak" :
    " — CRITICAL: very low authority";

  return `BACKLINKS (DataForSEO):
  Domain rank: ${rank}${rankNote}
  Referring domains: ${domains}
  Total backlinks: ${links}`;
}

export interface ReviewItem {
  rating: number;
  date?: string;
  hasOwnerResponse: boolean;
}

export interface ReviewsData {
  reviews: ReviewItem[];
  fetchError?: string;
}

export async function fetchReviewsData(
  businessName: string,
  city: string,
): Promise<ReviewsData> {
  const apiKey = process.env.DATAFORSEO_API_KEY;
  if (!apiKey) return { reviews: [], fetchError: "No API key" };

  try {
    const res = await fetch(
      "https://api.dataforseo.com/v3/business_data/google/reviews/live/advanced",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${apiKey}`,
        },
        body: JSON.stringify([
          {
            keyword: `${businessName} ${city}`,
            location_name: "United States",
            language_name: "English",
            depth: 10,
            sort_by: "newest",
          },
        ]),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!res.ok) return { reviews: [], fetchError: `HTTP ${res.status}` };
    const data = await res.json();
    const items: any[] = data?.tasks?.[0]?.result?.[0]?.items ?? [];

    const reviews: ReviewItem[] = items.map((item: any) => ({
      rating: item.rating?.value ?? item.rating,
      date: item.time_value ?? item.timestamp,
      hasOwnerResponse: !!item.owner_answer,
    }));

    return { reviews };
  } catch (err: any) {
    return { reviews: [], fetchError: err.message };
  }
}

export function formatReviewsBlock(rv: ReviewsData): string {
  if (rv.fetchError) {
    return `REVIEWS_DATA: Could not fetch (${rv.fetchError}) — use web search for review recency and response rate.`;
  }
  if (!rv.reviews.length) {
    return "REVIEWS_DATA: No reviews returned — use web search for review recency and response rate.";
  }

  const withResponse = rv.reviews.filter((r) => r.hasOwnerResponse).length;
  const responseRate = Math.round((withResponse / rv.reviews.length) * 100);
  const mostRecent = rv.reviews[0]?.date ?? "unknown";
  const avgRating =
    rv.reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rv.reviews.length;

  const recencyNote =
    rv.reviews[0]?.date
      ? ` (most recent: ${rv.reviews[0].date})`
      : "";

  return `REVIEWS_DATA (last ${rv.reviews.length} Google reviews, newest first):
  Most recent review: ${mostRecent}
  Avg rating (sample): ${avgRating.toFixed(1)}/5
  Owner response rate: ${responseRate}% (${withResponse} of ${rv.reviews.length} answered)${responseRate === 0 ? " — CRITICAL: no responses" : ""}`;
}

export function formatPageSpeedBlock(ps: PageSpeedData): string {
  if (ps.fetchError) {
    return `PAGESPEED: Could not fetch (${ps.fetchError}) — use web search to estimate.`;
  }

  const grade = (val: number | undefined, good: number, poor: number) => {
    if (val === undefined) return "no data";
    if (val <= good) return "PASS";
    if (val <= poor) return "NEEDS IMPROVEMENT";
    return "FAIL";
  };

  return `PAGESPEED (mobile, real-user data where available):
  LCP: ${ps.lcp !== undefined ? `${ps.lcp.toFixed(1)}s — ${grade(ps.lcp, 2.5, 4)}` : "no data"}
  INP: ${ps.inp !== undefined ? `${ps.inp}ms — ${grade(ps.inp, 200, 500)}` : "no data"}
  CLS: ${ps.cls !== undefined ? `${ps.cls.toFixed(3)} — ${grade(ps.cls, 0.1, 0.25)}` : "no data"}
  Performance score (mobile): ${ps.mobileScore ?? "no data"}/100`;
}
