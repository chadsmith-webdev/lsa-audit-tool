import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { fetchSubscription } from "@/lib/paypal";

/**
 * PayPal redirects here after the user approves a subscription.
 * URL: /api/paypal/return?subscription_id=...&tier=pro&billing=annual
 *
 * We fetch the subscription from PayPal, mark our row as trialing/active,
 * and redirect the user into their dashboard. The webhook is the source of
 * truth long-term, but updating here gives a better UX.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const subscriptionId = url.searchParams.get("subscription_id");
  const tierParam = url.searchParams.get("tier");
  const billingParam = url.searchParams.get("billing");
  const tier = tierParam === "agency" ? "agency" : "pro";
  const billing = billingParam === "annual" ? "annual" : "monthly";

  if (!subscriptionId) {
    return NextResponse.redirect(
      new URL("/pricing?error=missing_sub", req.url),
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const sub = await fetchSubscription(subscriptionId);
    const status = mapPaypalStatus(sub.status);
    const trialEndsAt = computeTrialEnd(sub);
    const periodEnd = sub.billing_info?.next_billing_time ?? null;

    const db = getSupabase();
    await db
      .from("subscriptions")
      .update({
        paypal_subscription_id: sub.id,
        plan: tier,
        billing,
        status,
        trial_ends_at: trialEndsAt,
        current_period_end: periodEnd,
        early_adopter: billing === "annual",
      })
      .eq("user_id", user.id);
  } catch {
    // Webhook will reconcile this — don't block the user.
  }

  return NextResponse.redirect(new URL("/dashboard?welcome=trial", req.url));
}

function mapPaypalStatus(
  status: string,
): "trialing" | "active" | "inactive" | "cancelled" | "expired" | "past_due" {
  switch (status) {
    case "ACTIVE":
      // We can't tell trial vs. paid from status alone — check billing_info too.
      return "trialing";
    case "APPROVAL_PENDING":
    case "APPROVED":
      return "trialing";
    case "SUSPENDED":
      return "past_due";
    case "CANCELLED":
      return "cancelled";
    case "EXPIRED":
      return "expired";
    default:
      return "inactive";
  }
}

function computeTrialEnd(sub: {
  billing_info?: {
    next_billing_time?: string;
    cycle_executions?: Array<{
      tenure_type: "TRIAL" | "REGULAR";
      cycles_completed: number;
    }>;
  };
}): string | null {
  // If a trial cycle is configured and not yet completed, the next_billing_time
  // is when the trial ends.
  const trial = sub.billing_info?.cycle_executions?.find(
    (c) => c.tenure_type === "TRIAL",
  );
  if (
    trial &&
    trial.cycles_completed === 0 &&
    sub.billing_info?.next_billing_time
  ) {
    return sub.billing_info.next_billing_time;
  }
  return null;
}
