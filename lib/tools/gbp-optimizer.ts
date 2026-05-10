import type { AuditRow, AuditResult } from "@/lib/types";

/**
 * GBP Optimizer — fix detection.
 *
 * Pure functions that turn a saved audit row into a list of actionable fixes.
 * Rules-based; no LLM here. The matching tool page can layer AI-generated
 * copy on top of these (description rewrites, post ideas) in a follow-up.
 *
 * Severity rubric:
 *   critical  — likely costing you customers right now
 *   important — meaningful boost when fixed
 *   polish    — incremental, do after the bigger wins
 */

export type FixSeverity = "critical" | "important" | "polish";

export interface GbpFix {
  id: string;
  severity: FixSeverity;
  title: string;
  why: string;
  how: string;
  /** Optional deep-link to the matching control inside Google Business Profile. */
  actionHref?: string;
  actionLabel?: string;
}

interface GbpRow {
  gbp_found: boolean | null;
  gbp_rating: number | null;
  gbp_review_count: number | null;
  gbp_photo_count: number | null;
  gbp_has_hours: boolean | null;
  business_name: string | null;
  trade: string | null;
  city: string | null;
}

const GBP_DASHBOARD = "https://business.google.com/";

export function detectGbpFixes(row: GbpRow): GbpFix[] {
  const fixes: GbpFix[] = [];

  // ── Listing not found / unclaimed ─────────────────────────────────────
  if (row.gbp_found === false) {
    fixes.push({
      id: "claim-listing",
      severity: "critical",
      title: "Claim or create your Google Business Profile",
      why: "Google couldn't find a listing for this business at the location we audited. Without a verified profile you won't show up in the local map pack — that's where most local search clicks go.",
      how: "Go to business.google.com, search your name + city, and either claim the existing listing or create a new one. Verification usually takes 5–7 days by postcard.",
      actionHref: GBP_DASHBOARD,
      actionLabel: "Open Google Business Profile",
    });
    return fixes; // Nothing else worth checking until they have a listing.
  }

  // ── Hours missing ─────────────────────────────────────────────────────
  if (row.gbp_has_hours === false) {
    fixes.push({
      id: "add-hours",
      severity: "critical",
      title: "Add your business hours",
      why: "Listings without hours look abandoned. Google de-prioritizes them in the map pack and customers skip past — they want to know if you're open before they call.",
      how: "Open your profile → Edit profile → Hours. Add regular hours, plus special hours for holidays. If you're a 24/7 service, mark it explicitly.",
      actionHref: GBP_DASHBOARD,
      actionLabel: "Edit hours",
    });
  }

  // ── Photo count ───────────────────────────────────────────────────────
  const photos = row.gbp_photo_count ?? 0;
  if (photos < 10) {
    fixes.push({
      id: "add-photos",
      severity: "critical",
      title: `Add at least ${10 - photos} more photos`,
      why:
        "Profiles with 10+ photos get roughly 35% more clicks than thin profiles. You currently have " +
        photos +
        ". Photos are the single fastest visual proof you're a real, active business.",
      how: "Upload a mix: storefront/vehicle, team in uniform, before/after job shots, your logo, and the inside of your truck or shop. Aim for 25+ over time. Phone photos are fine — authentic beats glossy.",
      actionHref: GBP_DASHBOARD,
      actionLabel: "Upload photos",
    });
  } else if (photos < 25) {
    fixes.push({
      id: "more-photos",
      severity: "important",
      title: `Build toward 25 photos (you have ${photos})`,
      why: "You're past the bare minimum. Reaching 25+ photos signals an active, established business and gives Google more visual context for your service categories.",
      how: "Add one or two photos a week — recent jobs, equipment, team. Caption them with the trade and location when possible.",
      actionHref: GBP_DASHBOARD,
      actionLabel: "Upload photos",
    });
  }

  // ── Reviews ────────────────────────────────────────────────────────────
  const reviews = row.gbp_review_count ?? 0;
  const rating = row.gbp_rating ?? 0;

  if (reviews < 10) {
    fixes.push({
      id: "get-reviews",
      severity: "critical",
      title: `Get to 10 reviews (you have ${reviews})`,
      why: "Below 10 reviews most customers won't trust the rating, even if it's 5 stars. The map pack also tends to surface businesses with at least 10–20 reviews ahead of those without.",
      how: "Make a list of your last 30 happy customers. Text them a direct review link (you can grab it from your GBP dashboard → Get more reviews). Two of every five typically convert.",
      actionHref: GBP_DASHBOARD,
      actionLabel: "Get review link",
    });
  } else if (reviews < 50) {
    fixes.push({
      id: "scale-reviews",
      severity: "important",
      title: `Scale to 50 reviews (you have ${reviews})`,
      why: "50+ reviews is roughly the threshold where competitors stop being able to out-review you with a single push. It compounds — every review request you send now keeps paying off.",
      how: "Set a recurring habit: after every completed job, send a review-link text within 24 hours. The Pro Review Engine tool (coming soon) automates this.",
      actionHref: GBP_DASHBOARD,
      actionLabel: "Get review link",
    });
  }

  if (rating > 0 && rating < 4.0) {
    fixes.push({
      id: "rating-recovery",
      severity: "critical",
      title: `Recover your star rating (currently ${rating.toFixed(1)})`,
      why: "Below 4.0, conversion drops sharply — most people skip past you to a competitor with a better rating. Each new 5-star review pulls the average up faster than you'd think.",
      how: "Two parallel moves: (1) reply professionally to every negative review with a fix or apology — Google sees engagement, (2) push a 30-day campaign asking your best recent customers for reviews to dilute the bad ones.",
      actionHref: GBP_DASHBOARD,
      actionLabel: "Manage reviews",
    });
  } else if (rating >= 4.0 && rating < 4.5 && reviews >= 10) {
    fixes.push({
      id: "rating-polish",
      severity: "important",
      title: `Push toward 4.7+ (currently ${rating.toFixed(1)})`,
      why: "4.5–4.7 is the local-SEO sweet spot. Below that, customers comparison-shop. Above 4.8, people sometimes get suspicious. You want to live at 4.6–4.8.",
      how: "Reply to every review (positive and negative). Ask only your most enthusiastic customers, not everyone. Quality of asks > quantity.",
      actionHref: GBP_DASHBOARD,
      actionLabel: "Manage reviews",
    });
  }

  // ── Always-on polish items ────────────────────────────────────────────
  fixes.push({
    id: "post-cadence",
    severity: "polish",
    title: "Post weekly to your profile",
    why: "Weekly posts are a freshness signal Google rewards. They also give you a second surface in the map pack — when someone clicks your listing, your latest post is visible alongside reviews.",
    how: "Pick one cadence and stick with it: a job photo every Monday, a tip every Wednesday, or a special every Friday. 3–4 sentences plus one image is enough.",
    actionHref: GBP_DASHBOARD,
    actionLabel: "Create a post",
  });

  fixes.push({
    id: "services-list",
    severity: "polish",
    title: "Fill out every service you offer",
    why: "Each service you list becomes a keyword Google can match queries against. Most local businesses leave 60% of their services blank — pure free real estate.",
    how: "In your profile → Services, add every job type you'll do, even the small ones. Use customer language ('drain cleaning' not 'hydro-jetting').",
    actionHref: GBP_DASHBOARD,
    actionLabel: "Edit services",
  });

  return fixes;
}

/** Convenience for the tool page — sorts by severity. */
export function sortFixes(fixes: GbpFix[]): GbpFix[] {
  const order: Record<FixSeverity, number> = {
    critical: 0,
    important: 1,
    polish: 2,
  };
  return [...fixes].sort((a, b) => order[a.severity] - order[b.severity]);
}

export function rowFromAudit(
  row: Pick<
    AuditRow,
    | "gbp_found"
    | "gbp_rating"
    | "gbp_review_count"
    | "gbp_photo_count"
    | "gbp_has_hours"
    | "business_name"
    | "trade"
    | "city"
  >,
): GbpRow {
  return {
    gbp_found: row.gbp_found ?? null,
    gbp_rating: row.gbp_rating ?? null,
    gbp_review_count: row.gbp_review_count ?? null,
    gbp_photo_count: row.gbp_photo_count ?? null,
    gbp_has_hours: row.gbp_has_hours ?? null,
    business_name: row.business_name ?? null,
    trade: row.trade ?? null,
    city: row.city ?? null,
  };
}

// Re-export for any callers that import from this module
export type { AuditResult };
