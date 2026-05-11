import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { getSupabase } from "@/lib/supabase";
import type { AuditRow } from "@/lib/types";
import GBPWidget from "@/app/components/GBPWidget";
import CitationsWidget from "@/app/components/CitationsWidget";
import ReviewsWidget from "@/app/components/ReviewsWidget";
import CompetitorsWidget from "@/app/components/CompetitorsWidget";
import BacklinksWidget from "@/app/components/BacklinksWidget";
import OnPageWidget from "@/app/components/OnPageWidget";
import TechnicalWidget from "@/app/components/TechnicalWidget";
import AICitabilityWidget from "@/app/components/AICitabilityWidget";
import DeleteAuditButton from "@/app/components/DeleteAuditButton";
import UpgradeSlot from "@/app/components/UpgradeSlot";
import { getUserPlan, hasProAccess } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Dashboard — Local Search Ally",
  description: "Monitor and manage your local SEO.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const showTrialWelcome = welcome === "trial";

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const plan = await getUserPlan(user.id);
  const hasPro = hasProAccess(plan);

  const db = getSupabase();

  const [{ data: audits, error }, { data: scans }, { data: latestFull }] =
    await Promise.all([
      db
        .from("audits")
        .select(
          "id, created_at, business_name, trade, city, gbp_found, gbp_rating, gbp_review_count, gbp_photo_count, gbp_has_hours",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("grid_scans")
        .select(
          "id, business_name, keyword, center_lat, center_lng, radius_miles, grid_size, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      db
        .from("audits")
        .select("result, created_at, business_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

  if (error) {
    console.error("[dashboard] query error:", error.message);
  }

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
  const latestBusiness = rows[0]?.business_name ?? "";
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
        role='banner'
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
              href='/dashboard/grid'
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--carolina)",
                textDecoration: "none",
              }}
            >
              Geo-Grid
            </Link>
            <form action='/auth/signout' method='POST'>
              <button type='submit' className='btn btn-ghost btn-sm'>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page body */}
      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "var(--space-10) var(--page-gutter)",
        }}
      >
        {showTrialWelcome && plan.status === "trialing" && (
          <div
            role='status'
            aria-live='polite'
            style={{
              marginBottom: "var(--space-6)",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "10px",
              border: "1px solid var(--border-accent)",
              background: "var(--carolina-dim)",
              display: "flex",
              gap: "var(--space-3)",
              alignItems: "flex-start",
            }}
          >
            <span
              aria-hidden='true'
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--carolina)",
                flexShrink: 0,
                paddingTop: "2px",
              }}
            >
              Trial active
            </span>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                You’re in. Your 14-day Pro trial is live.
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {plan.daysLeftInTrial !== null
                  ? `${plan.daysLeftInTrial} day${plan.daysLeftInTrial === 1 ? "" : "s"} left — cancel anytime before then and you won’t be charged.`
                  : "Cancel anytime in the next 14 days and you won’t be charged."}
              </p>
            </div>
          </div>
        )}

        {/* Page title */}
        <div
          className='animate-fade-up'
          style={{ marginBottom: "var(--space-8)" }}
        >
          <h1
            className='heading-1'
            style={{ marginBottom: latestFull ? "var(--space-2)" : 0 }}
          >
            {latestBusiness || "Your Dashboard"}
          </h1>
          {latestFull?.created_at && (
            <p className='text-small' style={{ color: "var(--muted)" }}>
              Last audited{" "}
              {new Date(latestFull.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {" · "}
              <a
                href='/'
                style={{ color: "var(--carolina)", textDecoration: "none" }}
              >
                Run new audit →
              </a>
            </p>
          )}
        </div>

        {/* Two-column layout on wider screens */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "var(--space-6)",
          }}
          className='dashboard-grid'
        >
          {/* Geo-Grid — summary card */}
          <section className='animate-fade-up stagger-1'>
            <div
              className='card card-default'
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "var(--space-4)",
              }}
            >
              <div>
                <p className='label' style={{ marginBottom: "var(--space-2)" }}>
                  Geo-Grid Rank Tracker
                </p>
                {recentScans.length > 0 ? (
                  <>
                    <p
                      style={{
                        fontSize: "var(--text-base)",
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      {recentScans[0].keyword}
                    </p>
                    <p className='text-small'>
                      Last scan{" "}
                      {new Date(recentScans[0].created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                      {" · "}
                      {recentScans[0].business_name}
                    </p>
                  </>
                ) : (
                  <p className='text-small'>
                    No scans yet — run your first geo-grid scan to see local
                    visibility across your service area.
                  </p>
                )}
              </div>
              <Link
                href='/dashboard/grid'
                className='btn btn-primary'
                style={{ flexShrink: 0 }}
              >
                {recentScans.length > 0
                  ? "View Full Grid →"
                  : "Run First Scan →"}
              </Link>
            </div>
          </section>

          {/* GBP + Reviews — side by side */}
          {(latestGBP || reviewsSection) && (
            <section className='animate-fade-up stagger-2'>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "var(--space-4)",
                  alignItems: "stretch",
                }}
              >
                {latestGBP && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-2)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <GBPWidget gbp={latestGBP} />
                    </div>
                    <UpgradeSlot tool='gbp' hasPro={hasPro} />
                  </div>
                )}
                {reviewsSection && latestFull && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-2)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <ReviewsWidget
                        section={reviewsSection}
                        auditDate={latestFull.created_at}
                        businessName={latestFull.business_name}
                      />
                    </div>
                    <UpgradeSlot tool='reviews' hasPro={hasPro} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Citations — full width */}
          {citationsSection && latestFull && (
            <section
              className='animate-fade-up stagger-3'
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <CitationsWidget
                section={citationsSection}
                auditDate={latestFull.created_at}
                businessName={latestFull.business_name}
              />
              <UpgradeSlot tool='citations' hasPro={hasPro} />
            </section>
          )}

          {/* Competitors — full width */}
          {competitorsSection && latestFull && (
            <section
              className='animate-fade-up stagger-4'
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <CompetitorsWidget
                section={competitorsSection}
                competitorNames={competitorNames}
                auditDate={latestFull.created_at}
                businessName={latestFull.business_name}
              />
              <UpgradeSlot tool='competitors' hasPro={hasPro} />
            </section>
          )}

          {/* Backlinks — full width */}
          {backlinksSection && latestFull && (
            <section
              className='animate-fade-up stagger-4'
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <BacklinksWidget
                section={backlinksSection}
                auditDate={latestFull.created_at}
                businessName={latestFull.business_name}
              />
              <UpgradeSlot tool='backlinks' hasPro={hasPro} />
            </section>
          )}

          {/* On-Page + Technical — side by side */}
          {(onpageSection || technicalSection) && latestFull && (
            <section className='animate-fade-up stagger-4'>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "var(--space-4)",
                  alignItems: "stretch",
                }}
              >
                {onpageSection && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-2)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <OnPageWidget
                        section={onpageSection}
                        auditDate={latestFull.created_at}
                        businessName={latestFull.business_name}
                      />
                    </div>
                    <UpgradeSlot tool='onpage' hasPro={hasPro} />
                  </div>
                )}
                {technicalSection && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-2)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <TechnicalWidget
                        section={technicalSection}
                        auditDate={latestFull.created_at}
                        businessName={latestFull.business_name}
                      />
                    </div>
                    <UpgradeSlot tool='technical' hasPro={hasPro} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AI Visibility — full width */}
          {aiCitabilitySection && latestFull && (
            <section
              className='animate-fade-up stagger-4'
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <AICitabilityWidget
                section={aiCitabilitySection}
                auditDate={latestFull.created_at}
                businessName={latestFull.business_name}
              />
              <UpgradeSlot tool='ai-visibility' hasPro={hasPro} />
            </section>
          )}

          {/* Audit history */}
          <section className='animate-fade-up stagger-4'>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--space-4)",
              }}
            >
              <h2 className='heading-3'>Audit History</h2>
              <Link href='/' className='btn btn-ghost btn-sm'>
                + New Audit
              </Link>
            </div>

            {rows.length === 0 ? (
              <div
                className='card card-default'
                style={{ textAlign: "center", padding: "var(--space-10)" }}
              >
                <p
                  className='text-small'
                  style={{ marginBottom: "var(--space-4)" }}
                >
                  No audits yet. Run one to see results here.
                </p>
                <Link href='/' className='btn btn-primary btn-sm'>
                  Run a free audit
                </Link>
              </div>
            ) : (
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
                    <li
                      key={audit.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                      }}
                    >
                      <Link
                        href={`/audit/${audit.id}`}
                        className='card card-default'
                        style={{
                          flex: 1,
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
                      <DeleteAuditButton auditId={audit.id} />
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
