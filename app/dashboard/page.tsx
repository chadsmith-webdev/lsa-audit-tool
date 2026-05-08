import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase";
import { getSupabase } from "@/lib/supabase";
import type { AuditRow } from "@/lib/types";
import GeoGrid from "@/app/components/GeoGrid";

export const metadata: Metadata = {
  title: "Dashboard — Local Search Ally",
  description: "Monitor and manage your local SEO.",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const db = getSupabase();

  const [{ data: audits, error }, { data: scans }] = await Promise.all([
    db
      .from("audits")
      .select("id, created_at, business_name, trade, city")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("grid_scans")
      .select("id, business_name, keyword, center_lat, center_lng, radius_miles, grid_size, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (error) {
    console.error("[dashboard] query error:", error.message);
  }

  const rows = (audits ?? []) as Pick<AuditRow, "id" | "created_at" | "business_name" | "trade" | "city">[];
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
  const latestBusiness = rows[0]?.business_name ?? "";
  const latestTrade = rows[0]?.trade ?? "";
  const latestCity = rows[0]?.city ?? "";

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

          <form action="/auth/signout" method="POST">
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Page body */}
      <main style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "var(--space-10) var(--page-gutter)",
      }}>

        {/* Page title */}
        <div style={{ marginBottom: "var(--space-8)" }}>
          <p className="label" style={{ marginBottom: "var(--space-2)" }}>Dashboard</p>
          <h1 className="heading-1">Your SEO Overview</h1>
        </div>

        {/* Two-column layout on wider screens */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "var(--space-6)",
        }}
          className="dashboard-grid"
        >

          {/* Geo-Grid — full width first */}
          <section>
            <Suspense fallback={<div className="card card-default" style={{ minHeight: 200 }} />}>
              <GeoGrid businessName={latestBusiness} trade={latestTrade} city={latestCity} recentScans={recentScans} />
            </Suspense>
          </section>

          {/* Audit history */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
              <h2 className="heading-3">Audit History</h2>
              <Link href="/" className="btn btn-ghost btn-sm">
                + New Audit
              </Link>
            </div>

            {rows.length === 0 ? (
              <div className="card card-default" style={{ textAlign: "center", padding: "var(--space-10)" }}>
                <p className="text-small" style={{ marginBottom: "var(--space-4)" }}>
                  No audits yet. Run one to see results here.
                </p>
                <Link href="/" className="btn btn-primary btn-sm">
                  Run a free audit
                </Link>
              </div>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", listStyle: "none" }}>
                {rows.map((audit) => {
                  const date = new Date(audit.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <li key={audit.id}>
                      <Link
                        href={`/audit/${audit.id}`}
                        className="card card-default"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          textDecoration: "none",
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text)" }}>
                            {audit.business_name ?? "Unnamed business"}
                          </p>
                          <p className="text-small" style={{ marginTop: "var(--space-1)" }}>
                            {[audit.trade, audit.city].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <span className="text-small" style={{ flexShrink: 0, marginLeft: "var(--space-4)" }}>
                          {date}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
