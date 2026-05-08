// ─── Backlinks + Reviews prefetch functions ───────────────────────────────────

export interface BacklinksData {
  domainRank?: number;
  referringDomains?: number;
  backlinks?: number;
  fetchError?: string;
}

export async function fetchBacklinksData(
  websiteUrl: string,
): Promise<BacklinksData> {
  const apiKey = process.env.DATAFORSEO_API_KEY;
  if (!apiKey) return { fetchError: "No API key" };

  let hostname: string;
  try {
    hostname = new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return { fetchError: "Invalid URL" };
  }

  try {
    const res = await fetch(
      "https://api.dataforseo.com/v3/backlinks/summary/live",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${apiKey}`,
        },
        body: JSON.stringify([{ target: hostname, include_subdomains: true }]),
        signal: AbortSignal.timeout(15_000),
      },
    );

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
  const domains =
    bl.referringDomains !== undefined
      ? bl.referringDomains.toLocaleString()
      : "unknown";
  const links =
    bl.backlinks !== undefined ? bl.backlinks.toLocaleString() : "unknown";

  const rankNote =
    bl.domainRank === undefined
      ? ""
      : bl.domainRank >= 40
        ? " — solid"
        : bl.domainRank >= 20
          ? " — weak"
          : " — CRITICAL: very low authority";

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

  const recencyNote = rv.reviews[0]?.date
    ? ` (most recent: ${rv.reviews[0].date})`
    : "";

  return `REVIEWS_DATA (last ${rv.reviews.length} Google reviews, newest first):
  Most recent review: ${mostRecent}
  Avg rating (sample): ${avgRating.toFixed(1)}/5
  Owner response rate: ${responseRate}% (${withResponse} of ${rv.reviews.length} answered)${responseRate === 0 ? " — CRITICAL: no responses" : ""}`;
}
