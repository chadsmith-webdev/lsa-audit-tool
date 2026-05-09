import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { createServerClient, getSupabase } from "@/lib/supabase";
import type { AuditRow } from "@/lib/types";
import GeoGrid from "@/app/components/GeoGrid";
import GBPWidget from "@/app/components/GBPWidget";
import CitationsWidget from "@/app/components/CitationsWidget";
import ReviewsWidget from "@/app/components/ReviewsWidget";
import CompetitorsWidget from "@/app/components/CompetitorsWidget";
import BacklinksWidget from "@/app/components/BacklinksWidget";
import OnPageWidget from "@/app/components/OnPageWidget";
import TechnicalWidget from "@/app/components/TechnicalWidget";
import AICitabilityWidget from "@/app/components/AICitabilityWidget";

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // Must be logged in and admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = getSupabase();
  const { data: adminProfile } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!adminProfile?.is_admin) redirect("/dashboard");

  // Load the client's profile
  const { data: clientProfile } = await db
    .from("profiles")
    .select("id, email, business_name")
    .eq("id", clientId)
    .single();

  if (!clientProfile) redirect("/admin");

  // Load client data — same queries as dashboard but scoped to clientId
  const [{ data: audits }, { data: scans }, { data: latestFull }] =
    await Promise.all([
      db
        .from("audits")
        .select(
          "id, created_at, business_name, trade, city, gbp_found, gbp_rating, gbp_review_count, gbp_photo_count, gbp_has_hours",
        )
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("grid_scans")
        .select(
          "id, business_name, keyword, center_lat, center_lng, radius_miles, grid_size, created_at",
        )
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(20),
      db
        .from("audits")
        .select("result, created_at, business_name")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

  const rows = (audits ?? []) as Pick<
    AuditRow,
    | "id"
    | "created_at"
    | "business_name"
    | "trade"
    | "city"
    | "gbp_found"
    | "gbp_rating"
    | "gbp_review_count"
    | "gbp_photo_count"
    | "gbp_has_hours"
  >[];
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

  const latestBusiness =
    rows[0]?.business_name ??
    clientProfile.business_name ??
    clientProfile.email;
  const latestTrade = rows[0]?.trade ?? "";
  const latestCity = rows[0]?.city ?? "";
  const latestGBP = rows[0]
    ? {
        found: rows[0].gbp_found ?? false,
        rating: rows[0].gbp_rating ?? null,
        reviewCount: rows[0].gbp_review_count ?? null,
        photoCount: rows[0].gbp_photo_count ?? null,
        hasHours: rows[0].gbp_has_hours ?? null,
        auditDate: rows[0].created_at,
        businessName: rows[0].business_name,
      }
    : null;

  const latestResult = latestFull?.result as
    | import("@/lib/types").AuditResult
    | undefined;
  const citationsSection =
    latestResult?.sections?.find((s) => s.id === "citations") ?? null;
  const reviewsSection =
    latestResult?.sections?.find((s) => s.id === "reviews") ?? null;
  const competitorsSection =
    latestResult?.sections?.find((s) => s.id === "competitors") ?? null;
  const competitorNames = latestResult?.competitor_names ?? [];
  const backlinksSection =
    latestResult?.sections?.find((s) => s.id === "backlinks") ?? null;
  const onpageSection =
    latestResult?.sections?.find((s) => s.id === "onpage") ?? null;
  const technicalSection =
    latestResult?.sections?.find((s) => s.id === "technical") ?? null;
  const aiCitabilitySection =
    latestResult?.sections?.find((s) => s.id === "ai_citability") ??
    (latestResult?.ai_citability_section
      ? {
          ...latestResult.ai_citability_section,
          id: "ai_citability",
          name: "AI Visibility",
          sub_signals: latestResult.ai_citability_section.sub_signals
            ? {
                ...latestResult.ai_citability_section.sub_signals,
                schema_markup:
                  latestResult.ai_citability_section.sub_signals
                    .schema_markup ?? ("weak" as const),
              }
            : undefined,
        }
      : null);

  return (
    <div className='min-h-screen' style={{ background: "var(--bg)" }}>
      {/* Nav */}
      <header
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-strong)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 var(--page-gutter)",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 100 100'
              style={{ width: "24px", height: "24px", flexShrink: 0 }}
              aria-hidden='true'
            >
              <defs>
                <linearGradient
                  id='needleGrad'
                  x1='0'
                  x2='1'
                  gradientUnits='objectBoundingBox'
                >
                  <stop offset='0' stopColor='white' stopOpacity='0.5' />
                  <stop offset='0.45' stopColor='white' stopOpacity='1' />
                  <stop offset='1' stopColor='white' stopOpacity='0.35' />
                </linearGradient>
                <clipPath id='ballClip'>
                  <circle cx='50' cy='33' r='20' />
                </clipPath>
              </defs>
              <polygon points='48,52 52,52 50,93' fill='url(#needleGrad)' />
              <circle cx='50' cy='33' r='20' fill='#7bafd4' />
              <g clipPath='url(#ballClip)'>
                <circle cx='46' cy='28' r='10' fill='white' opacity='0.88' />
                <circle cx='49.5' cy='30.5' r='10.1' fill='#7bafd4' />
              </g>
            </svg>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "var(--text-base)",
                color: "var(--text)",
                letterSpacing: "-0.02em",
              }}
            >
              Local Search{" "}
              <span style={{ color: "var(--carolina)" }}>Ally</span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
            }}
          >
            <Link
              href='/admin'
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--carolina)",
                textDecoration: "none",
              }}
            >
              ← All Clients
            </Link>
            <form action='/auth/signout' method='POST'>
              <button type='submit' className='btn btn-ghost btn-sm'>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Admin banner */}
      <div
        style={{
          background: "rgba(123,175,212,0.08)",
          borderBottom: "1px solid rgba(123,175,212,0.2)",
          padding: "var(--space-3) var(--page-gutter)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--carolina)",
              background: "rgba(123,175,212,0.15)",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
            }}
          >
            Admin View
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
            Viewing dashboard for{" "}
            <strong style={{ color: "var(--text)" }}>{latestBusiness}</strong>
            {clientProfile.email && <span> · {clientProfile.email}</span>}
          </span>
        </div>
      </div>

      {/* Page body */}
      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "var(--space-10) var(--page-gutter)",
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: "var(--space-8)" }}>
          <p className='label' style={{ marginBottom: "var(--space-2)" }}>
            Client Dashboard
          </p>
          <h1 className='heading-1'>{latestBusiness}</h1>
          {(latestTrade || latestCity) && (
            <p
              style={{
                color: "var(--muted)",
                fontSize: "var(--text-sm)",
                marginTop: "var(--space-2)",
              }}
            >
              {[latestTrade, latestCity].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {rows.length === 0 ? (
          <div
            className='card card-default'
            style={{ textAlign: "center", padding: "var(--space-10)" }}
          >
            <p className='text-small'>No audits yet for this client.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "var(--space-6)",
            }}
            className='dashboard-grid'
          >
            {/* Geo-Grid */}
            <section>
              <Suspense
                fallback={
                  <div
                    className='card card-default'
                    style={{ minHeight: 200 }}
                  />
                }
              >
                <GeoGrid
                  businessName={latestBusiness}
                  trade={latestTrade}
                  city={latestCity}
                  recentScans={recentScans}
                />
              </Suspense>
            </section>

            {/* GBP + Reviews */}
            {(latestGBP || reviewsSection) && (
              <section>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "var(--space-4)",
                    alignItems: "stretch",
                  }}
                >
                  {latestGBP && <GBPWidget gbp={latestGBP} />}
                  {reviewsSection && latestFull && (
                    <ReviewsWidget
                      section={reviewsSection}
                      auditDate={latestFull.created_at}
                      businessName={latestFull.business_name}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Citations */}
            {citationsSection && latestFull && (
              <section>
                <CitationsWidget
                  section={citationsSection}
                  auditDate={latestFull.created_at}
                  businessName={latestFull.business_name}
                />
              </section>
            )}

            {/* Competitors */}
            {competitorsSection && latestFull && (
              <section>
                <CompetitorsWidget
                  section={competitorsSection}
                  competitorNames={competitorNames}
                  auditDate={latestFull.created_at}
                  businessName={latestFull.business_name}
                />
              </section>
            )}

            {/* Backlinks */}
            {backlinksSection && latestFull && (
              <section>
                <BacklinksWidget
                  section={backlinksSection}
                  auditDate={latestFull.created_at}
                  businessName={latestFull.business_name}
                />
              </section>
            )}

            {/* On-Page + Technical */}
            {(onpageSection || technicalSection) && latestFull && (
              <section>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "var(--space-4)",
                    alignItems: "stretch",
                  }}
                >
                  {onpageSection && (
                    <OnPageWidget
                      section={onpageSection}
                      auditDate={latestFull.created_at}
                      businessName={latestFull.business_name}
                    />
                  )}
                  {technicalSection && (
                    <TechnicalWidget
                      section={technicalSection}
                      auditDate={latestFull.created_at}
                      businessName={latestFull.business_name}
                    />
                  )}
                </div>
              </section>
            )}

            {/* AI Visibility */}
            {aiCitabilitySection && latestFull && (
              <section>
                <AICitabilityWidget
                  section={aiCitabilitySection}
                  auditDate={latestFull.created_at}
                  businessName={latestFull.business_name}
                />
              </section>
            )}

            {/* Audit history */}
            <section>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-4)",
                }}
              >
                <h2 className='heading-3'>Audit History</h2>
              </div>
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  listStyle: "none",
                }}
              >
                {rows.map((audit) => {
                  const date = new Date(audit.created_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  );
                  return (
                    <li key={audit.id}>
                      <Link
                        href={`/audit/${audit.id}`}
                        className='card card-default'
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          textDecoration: "none",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontWeight: 600,
                              fontSize: "var(--text-base)",
                              color: "var(--text)",
                            }}
                          >
                            {audit.business_name ?? "Unnamed business"}
                          </p>
                          <p
                            className='text-small'
                            style={{ marginTop: "var(--space-1)" }}
                          >
                            {[audit.trade, audit.city]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <span
                          className='text-small'
                          style={{
                            flexShrink: 0,
                            marginLeft: "var(--space-4)",
                          }}
                        >
                          {date}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
