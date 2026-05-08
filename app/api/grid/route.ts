import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { getSupabase } from "@/lib/supabase";
import { buildGrid } from "@/lib/grid";

const DATAFORSEO_API = "https://api.dataforseo.com/v3/serp/google/maps/live/advanced";
const GRID_SIZE = 5;
const RADIUS_MILES = 1;
// DataForSEO expects radius in kilometres for location_coordinate
const MILES_TO_KM = 1.60934;
// Batch size — stay under DataForSEO rate limits
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkRankAtPoint(
  keyword: string,
  businessName: string,
  lat: number,
  lng: number,
  apiKey: string,
): Promise<{ rank: number | null; competitors: object[] }> {
  const radiusKm = RADIUS_MILES * MILES_TO_KM;
  const body = [
    {
      keyword,
      location_coordinate: `${lat},${lng},${radiusKm}km`,
      language_code: "en",
      depth: 20,
    },
  ];

  const res = await fetch(DATAFORSEO_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`[grid] DataForSEO error at (${lat},${lng}):`, res.status);
    return { rank: null, competitors: [] };
  }

  const data = await res.json();
  const items: any[] =
    data?.tasks?.[0]?.result?.[0]?.items ?? [];

  const competitors = items.slice(0, 5).map((item: any) => ({
    title: item.title ?? "",
    rank: item.rank_absolute ?? null,
  }));

  const normalizedTarget = businessName.toLowerCase().trim();
  const match = items.find((item: any) =>
    (item.title ?? "").toLowerCase().includes(normalizedTarget) ||
    normalizedTarget.includes((item.title ?? "").toLowerCase()),
  );

  const rank = match ? (match.rank_absolute ?? null) : null;

  return { rank, competitors };
}

export async function POST(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { keyword, businessName, centerLat, centerLng, auditId } = body;

  if (!keyword || !businessName || centerLat == null || centerLng == null) {
    return NextResponse.json(
      { error: "Missing required fields: keyword, businessName, centerLat, centerLng" },
      { status: 400 },
    );
  }

  const apiKey = process.env.DATAFORSEO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DataForSEO API key not configured" }, { status: 500 });
  }

  const db = getSupabase();

  // Create the scan record
  const { data: scan, error: scanErr } = await db
    .from("grid_scans")
    .insert({
      user_id: user.id,
      audit_id: auditId ?? null,
      business_name: businessName,
      keyword,
      center_lat: centerLat,
      center_lng: centerLng,
      radius_miles: RADIUS_MILES,
      grid_size: GRID_SIZE,
    })
    .select("id")
    .single();

  if (scanErr || !scan) {
    console.error("[grid] scan insert error:", scanErr?.message);
    return NextResponse.json({ error: "Failed to create scan" }, { status: 500 });
  }

  const scanId = scan.id;
  const points = buildGrid(centerLat, centerLng, RADIUS_MILES, GRID_SIZE);

  // Process in batches to respect rate limits
  const results: { scan_id: string; point_index: number; lat: number; lng: number; rank: number | null; competitors: object }[] = [];

  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (point) => {
        const { rank, competitors } = await checkRankAtPoint(
          keyword,
          businessName,
          point.lat,
          point.lng,
          apiKey,
        );
        return {
          scan_id: scanId,
          point_index: point.index,
          lat: point.lat,
          lng: point.lng,
          rank,
          competitors,
        };
      }),
    );

    results.push(...batchResults);

    if (i + BATCH_SIZE < points.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Insert all results
  const { error: resultsErr } = await db.from("grid_results").insert(results);

  if (resultsErr) {
    console.error("[grid] results insert error:", resultsErr.message);
    return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
  }

  return NextResponse.json({ scanId, results });
}

export async function GET(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get("scanId");

  const db = getSupabase();

  if (scanId) {
    // Fetch a specific scan + results
    const { data: scan, error: scanErr } = await db
      .from("grid_scans")
      .select("*")
      .eq("id", scanId)
      .eq("user_id", user.id)
      .single();

    if (scanErr || !scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const { data: results } = await db
      .from("grid_results")
      .select("*")
      .eq("scan_id", scanId)
      .order("point_index", { ascending: true });

    return NextResponse.json({ scan, results: results ?? [] });
  }

  // List all scans for this user
  const { data: scans, error } = await db
    .from("grid_scans")
    .select("id, business_name, keyword, center_lat, center_lng, radius_miles, grid_size, created_at, audit_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[grid] list scans error:", error.message);
    return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
  }

  return NextResponse.json({ scans: scans ?? [] });
}
