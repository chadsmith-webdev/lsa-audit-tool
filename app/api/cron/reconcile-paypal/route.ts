import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { fetchSubscription } from "@/lib/paypal";

/**
 * Daily reconciliation cron — safety net for missed/late PayPal webhooks.
 *
 * Walks every subscription with a paypal_subscription_id whose status is one of
 * trialing | active | past_due | cancelled, pulls the freshest state from
 * PayPal, and rewrites the local row so it matches reality.
 *
 * Scheduled by vercel.json crons → runs daily at ~03:17 UTC.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. Set
 * CRON_SECRET in env. Manual runs from local dev can hit it with the same
 * header for testing.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const { data: rows, error } = await db
    .from("subscriptions")
    .select("user_id, paypal_subscription_id, status")
    .not("paypal_subscription_id", "is", null)
    .in("status", ["trialing", "active", "past_due", "cancelled"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    userId: string;
    subscriptionId: string;
    ok: boolean;
    status?: string;
    error?: string;
  }> = [];

  for (const row of rows ?? []) {
    const subscriptionId = row.paypal_subscription_id as string;
    try {
      const sub = await fetchSubscription(subscriptionId);
      const trial = sub.billing_info?.cycle_executions?.find(
        (c) => c.tenure_type === "TRIAL",
      );
      const stillInTrial = !!(trial && trial.cycles_completed === 0);
      const status =
        sub.status === "ACTIVE"
          ? stillInTrial
            ? "trialing"
            : "active"
          : sub.status === "SUSPENDED"
            ? "past_due"
            : sub.status === "CANCELLED"
              ? "cancelled"
              : sub.status === "EXPIRED"
                ? "expired"
                : "inactive";

      const update: Record<string, unknown> = {
        status,
        trial_ends_at: stillInTrial
          ? (sub.billing_info?.next_billing_time ?? null)
          : null,
        current_period_end: sub.billing_info?.next_billing_time ?? null,
      };
      if (status === "expired") update.plan = "free";

      await db
        .from("subscriptions")
        .update(update)
        .eq("paypal_subscription_id", subscriptionId);

      results.push({
        userId: row.user_id as string,
        subscriptionId,
        ok: true,
        status,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      results.push({
        userId: row.user_id as string,
        subscriptionId,
        ok: false,
        error: msg,
      });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  return NextResponse.json({
    checked: results.length,
    ok,
    failed,
    results,
  });
}
