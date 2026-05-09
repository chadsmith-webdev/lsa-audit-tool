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
        <div style={{ marginBottom: "var(--space-10)" }}>
          <p className="label" style={{ marginBottom: "var(--space-2)" }}>Tool</p>
          <h1 className="heading-1" style={{ marginBottom: "var(--space-4)" }}>Geo-Grid Rank Tracker</h1>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--muted)", maxWidth: "640px", lineHeight: 1.6 }}>
            See exactly where your business shows up — and where it doesn't — across your entire service area.
          </p>
        </div>

        {/* Explainer cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-10)",
        }}>
          {[
            {
              icon: "⊞",
              title: "What is the geo-grid?",
              body: "Google doesn't show every business the same rank everywhere. A 5×5 grid of 25 points is plotted across your service area. Each point checks where your business ranks at that exact location — giving you a real picture of your local visibility, not just one number.",
            },
            {
              icon: "◉",
              title: "How to read it",
              body: "Green markers mean you're ranking in the top 3 at that location — prime Map Pack territory. Yellow is rank 4–10, still visible but losing clicks fast. Red is rank 11–20. Gray means you didn't show up at all. The goal is a map full of green.",
            },
            {
              icon: "↑",
              title: "Tracking changes over time",
              body: "Run the same keyword scan again after making changes to your GBP, citations, or on-page content. Each marker shows an arrow indicating how your rank moved since the last scan — up is good, down means something needs attention.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="card card-default" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <span style={{
                fontSize: "1.5rem",
                lineHeight: 1,
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(123,175,212,0.1)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(123,175,212,0.2)",
                color: "var(--carolina)",
                flexShrink: 0,
              }}>
                {icon}
              </span>
              <div>
                <h3 style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: "var(--space-2)",
                }}>
                  {title}
                </h3>
                <p className="text-small" style={{ lineHeight: 1.6 }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips bar */}
        <div style={{
          background: "rgba(123,175,212,0.06)",
          border: "1px solid rgba(123,175,212,0.15)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4) var(--space-5)",
          marginBottom: "var(--space-8)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-6)",
        }}>
          {[
            { label: "Business name", tip: "Enter it exactly as it appears on your Google Business Profile — spelling, punctuation, and all." },
            { label: "Service area", tip: "Use the city or neighborhood you want to test. The grid will center on that point and spread outward." },
            { label: "Keyword", tip: "Use the keyword a real customer would type — trade + location works best (e.g. \"plumber Rogers AR\")." },
          ].map(({ label, tip }) => (
            <div key={label} style={{ flex: "1 1 200px" }}>
              <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--carolina)", marginBottom: "var(--space-1)" }}>
                {label}
              </p>
              <p className="text-small" style={{ lineHeight: 1.5 }}>{tip}</p>
            </div>
          ))}
        </div>

        {/* The tool */}
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
          />
        </Suspense>

      </main>
    </div>
  );
}
