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
import styles from "@/styles/dashboard.module.css";

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
    <div className={`min-h-screen ${styles.page}`}>
      {/* Nav */}
      <header role='banner' className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerBrand}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 100 100'
              className={styles.logoSvg}
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
            <span className={styles.logoText}>
              Local Search <span className={styles.logoAccent}>Ally</span>
            </span>
          </div>

          <div className={styles.headerNav}>
            <Link href='/dashboard/grid' className={styles.headerLink}>
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
      <main className={styles.main}>
        {showTrialWelcome && plan.status === "trialing" && (
          <div role='status' aria-live='polite' className={styles.trialBanner}>
            <span aria-hidden='true' className={styles.trialBadge}>
              Trial active
            </span>
            <div className={styles.trialBody}>
              <p className={styles.trialTitle}>
                You&rsquo;re in. Your 14-day Pro trial is live.
              </p>
              <p className={styles.trialSubtitle}>
                {plan.daysLeftInTrial !== null
                  ? `${plan.daysLeftInTrial} day${plan.daysLeftInTrial === 1 ? "" : "s"} left — cancel anytime before then and you won’t be charged.`
                  : "Cancel anytime in the next 14 days and you won’t be charged."}
              </p>
            </div>
          </div>
        )}

        {/* Page title */}
        <div className={`animate-fade-up ${styles.pageTitleWrap}`}>
          <h1
            className={`heading-1 ${latestFull ? styles.pageHeading : styles.pageHeadingFlush}`}
          >
            {latestBusiness || "Your Dashboard"}
          </h1>
          {latestFull?.created_at && (
            <p className={`text-small ${styles.pageMeta}`}>
              Last audited{" "}
              {new Date(latestFull.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {" · "}
              <Link href='/' className={styles.pageMetaLink}>
                Run new audit →
              </Link>
            </p>
          )}
        </div>

        {/* Two-column layout on wider screens */}
        <div className={`dashboard-grid ${styles.dashGrid}`}>
          {/* Geo-Grid — summary card */}
          <section className='animate-fade-up stagger-1'>
            <div className={`card card-default ${styles.gridSummaryCard}`}>
              <div>
                <p className={`label ${styles.gridSummaryLabel}`}>
                  Geo-Grid Rank Tracker
                </p>
                {recentScans.length > 0 ? (
                  <>
                    <p className={styles.gridSummaryKeyword}>
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
                className={`btn btn-primary ${styles.gridSummaryButton}`}
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
              <div className={styles.widgetPair}>
                {latestGBP && (
                  <div className={styles.widgetStack}>
                    <div className={styles.widgetStackFlex}>
                      <GBPWidget gbp={latestGBP} />
                    </div>
                    <UpgradeSlot tool='gbp' hasPro={hasPro} />
                  </div>
                )}
                {reviewsSection && latestFull && (
                  <div className={styles.widgetStack}>
                    <div className={styles.widgetStackFlex}>
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
              className={`animate-fade-up stagger-3 ${styles.widgetStack}`}
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
              className={`animate-fade-up stagger-4 ${styles.widgetStack}`}
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
              className={`animate-fade-up stagger-4 ${styles.widgetStack}`}
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
              <div className={styles.widgetPair}>
                {onpageSection && (
                  <div className={styles.widgetStack}>
                    <div className={styles.widgetStackFlex}>
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
                  <div className={styles.widgetStack}>
                    <div className={styles.widgetStackFlex}>
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
              className={`animate-fade-up stagger-4 ${styles.widgetStack}`}
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
            <div className={styles.historyHeader}>
              <h2 className='heading-3'>Audit History</h2>
              <Link href='/' className='btn btn-ghost btn-sm'>
                + New Audit
              </Link>
            </div>

            {rows.length === 0 ? (
              <div className={`card card-default ${styles.historyEmpty}`}>
                <p className={`text-small ${styles.historyEmptyText}`}>
                  No audits yet. Run one to see results here.
                </p>
                <Link href='/' className='btn btn-primary btn-sm'>
                  Run a free audit
                </Link>
              </div>
            ) : (
              <ul className={styles.historyList}>
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
                    <li key={audit.id} className={styles.historyRow}>
                      <Link
                        href={`/audit/${audit.id}`}
                        className={`card card-default ${styles.historyCard}`}
                      >
                        <div>
                          <p className={styles.historyTitle}>
                            {audit.business_name ?? "Unnamed business"}
                          </p>
                          <p className={`text-small ${styles.historySubtitle}`}>
                            {[audit.trade, audit.city]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <span className={`text-small ${styles.historyDate}`}>
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
