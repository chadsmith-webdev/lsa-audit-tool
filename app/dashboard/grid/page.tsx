import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createServerClient, getSupabase } from "@/lib/supabase";
import GeoGrid from "@/app/components/GeoGrid";

export const metadata: Metadata = {
  title: "Geo-Grid Rank Tracker — Local Search Ally",
  description: "See where your business ranks across a local service area for any keyword.",
};

export default async function GridPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = getSupabase();

  const [{ data: scans }, { data: audits }] = await Promise.all([
    db
      .from("grid_scans")
      .select("id, business_name, keyword, center_lat, center_lng, radius_miles, grid_size, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("audits")
      .select("business_name, trade, city")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const recentScans = (scans ?? []) as {
    id: string;
    business_name: string;
    keyword: string;
    center_lat: number;
    center_lng: number;
    radius_miles: number;
    grid_size: number;
    created_at: string;
  }[];

  const latestBusiness = audits?.business_name ?? "";
  const latestTrade = audits?.trade ?? "";
  const latestCity = audits?.city ?? "";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* Nav */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-strong)",
      }}>
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 var(--page-gutter)",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{ width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true">
              <defs>
                <linearGradient id="needleGrad" x1="0" x2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0" stopColor="white" stopOpacity="0.5" />
                  <stop offset="0.45" stopColor="white" stopOpacity="1" />
                  <stop offset="1" stopColor="white" stopOpacity="0.35" />
                </linearGradient>
                <clipPath id="ballClip">
                  <circle cx="50" cy="33" r="20" />
                </clipPath>
              </defs>
              <polygon points="48,52 52,52 50,93" fill="url(#needleGrad)" />
              <circle cx="50" cy="33" r="20" fill="#7bafd4" />
              <g clipPath="url(#ballClip)">
                <circle cx="46" cy="28" r="10" fill="white" opacity="0.88" />
                <circle cx="49.5" cy="30.5" r="10.1" fill="#7bafd4" />
              </g>
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text)", letterSpacing: "-0.02em" }}>
              Local Search <span style={{ color: "var(--carolina)" }}>Ally</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <Link href="/dashboard" style={{ fontSize: "var(--text-sm)", color: "var(--carolina)", textDecoration: "none" }}>
              ← Dashboard
            </Link>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="btn btn-ghost btn-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "var(--space-10) var(--page-gutter)" }}>

        {/* Page header */}
        <div className="animate-fade-up" style={{ marginBottom: "var(--space-8)" }}>
          <h1 className="heading-1" style={{ marginBottom: "var(--space-2)" }}>Geo-Grid Rank Tracker</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--muted)", maxWidth: "560px", lineHeight: 1.6 }}>
            See where your business ranks across 25 points in your service area — not just one average.
          </p>
        </div>

        {/* The tool */}
        <div className="animate-fade-up stagger-2">
        <Suspense fallback={
          <div className="card card-default" style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="text-small">Loading…</p>
          </div>
        }>
          <GeoGrid
            businessName={latestBusiness}
            trade={latestTrade}
            city={latestCity}
            recentScans={recentScans}
            showHeader={false}
          />
        </Suspense>
        </div>

      </main>
    </div>
  );
}
