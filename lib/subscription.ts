import { getSupabase } from "@/lib/supabase";

/**
 * Subscription helper — single source of truth for what a user can access.
 *
 * Plans:
 *   - "free"           → audits only, all Pro Tools locked
 *   - "pro"            → unlimited audits + all 8 Pro Tools, 1 location
 *   - "multi_location" → everything in Pro + up to 10 locations + white-label
 *
 * Statuses that grant Pro access:
 *   - "trialing"  → 14-day free trial window
 *   - "active"    → paying subscriber
 *   - "cancelled" → cancelled but still inside their paid period
 *
 * Everything else (inactive, past_due, expired) falls back to free-tier access.
 */

export type Plan = "free" | "pro" | "multi_location";
export type SubStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export interface SubscriptionRow {
  plan: Plan;
  status: SubStatus;
  billing: "monthly" | "annual";
  trial_ends_at: string | null;
  current_period_end: string | null;
  early_adopter: boolean;
  paypal_subscription_id: string | null;
}

export interface EffectivePlan {
  plan: Plan; // raw plan from row
  effective: Plan; // what the user actually has access to RIGHT NOW
  status: SubStatus;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  daysLeftInTrial: number | null;
  currentPeriodEnd: Date | null;
  earlyAdopter: boolean;
  billing: "monthly" | "annual";
}

/**
 * Get the current effective plan for a user.
 * Returns sensible defaults if no subscription row exists.
 */
export async function getUserPlan(userId: string): Promise<EffectivePlan> {
  const db = getSupabase();
  const { data, error } = await db
    .from("subscriptions")
    .select(
      "plan, status, billing, trial_ends_at, current_period_end, early_adopter, paypal_subscription_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return defaultFreePlan();
  }

  const row = data as SubscriptionRow;
  return resolvePlan(row);
}

/**
 * Resolve an effective plan from a subscription row.
 * Pure function — no DB calls. Useful when you've already fetched the row.
 */
export function resolvePlan(row: SubscriptionRow): EffectivePlan {
  const now = Date.now();
  const trialEndsAt = row.trial_ends_at ? new Date(row.trial_ends_at) : null;
  const periodEnd = row.current_period_end
    ? new Date(row.current_period_end)
    : null;

  const isTrialing =
    row.status === "trialing" &&
    trialEndsAt !== null &&
    trialEndsAt.getTime() > now;

  const inActivePeriod =
    row.status === "active" ||
    (row.status === "cancelled" &&
      periodEnd !== null &&
      periodEnd.getTime() > now);

  const grantsAccess = isTrialing || inActivePeriod;
  const effective: Plan =
    grantsAccess && row.plan !== "free" ? row.plan : "free";

  const daysLeftInTrial =
    isTrialing && trialEndsAt
      ? Math.max(
          0,
          Math.ceil((trialEndsAt.getTime() - now) / (1000 * 60 * 60 * 24)),
        )
      : null;

  return {
    plan: row.plan,
    effective,
    status: row.status,
    isTrialing,
    trialEndsAt,
    daysLeftInTrial,
    currentPeriodEnd: periodEnd,
    earlyAdopter: row.early_adopter,
    billing: row.billing,
  };
}

function defaultFreePlan(): EffectivePlan {
  return {
    plan: "free",
    effective: "free",
    status: "inactive",
    isTrialing: false,
    trialEndsAt: null,
    daysLeftInTrial: null,
    currentPeriodEnd: null,
    earlyAdopter: false,
    billing: "monthly",
  };
}

/**
 * Convenience: does this user have access to Pro Tools?
 */
export function hasProAccess(plan: EffectivePlan): boolean {
  return plan.effective === "pro" || plan.effective === "multi_location";
}
