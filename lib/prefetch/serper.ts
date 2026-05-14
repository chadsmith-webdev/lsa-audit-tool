// ─── Serper (competitor / Map Pack) prefetch functions ───────────────────────

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
    type RawSerperResult = Partial<SerperLocalResult>;
    const raw: RawSerperResult[] = data.localResults ?? data.places ?? [];

    const results: SerperLocalResult[] = raw.slice(0, 5).map((r) => ({
      title: r.title ?? "",
      address: r.address,
      rating: r.rating,
      ratingCount: r.ratingCount,
      category: r.category,
      phone: r.phone,
      website: r.website,
    }));

    return { results };
  } catch (err) {
    return {
      results: [],
      fetchError: err instanceof Error ? err.message : String(err),
    };
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
    const reviews =
      r.ratingCount !== undefined
        ? `${r.ratingCount} reviews`
        : "no review count";
    const site = r.website ? "has website" : "no website";
    return `  ${i + 1}. ${r.title} — ${rating}, ${reviews}, ${site}${r.address ? `, ${r.address}` : ""}`;
  });

  return `MAP_PACK (real Google results for this business type + city query):\n${lines.join("\n")}`;
}
