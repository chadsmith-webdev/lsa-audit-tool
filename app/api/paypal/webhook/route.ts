import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import {
  fetchSubscription,
  verifyWebhookSignature,
  type PayPalSubscription,
} from "@/lib/paypal";
import { cancelPendingDrips } from "@/lib/cancel-drips";

/**
 * PayPal Subscriptions webhook receiver.
 *
 * Configure the webhook in the PayPal dashboard pointing to:
 *   https://your-domain.com/api/paypal/webhook
 *
 * Subscribe to these events:
 *   - BILLING.SUBSCRIPTION.ACTIVATED
 *   - BILLING.SUBSCRIPTION.UPDATED
 *   - BILLING.SUBSCRIPTION.CANCELLED
 *   - BILLING.SUBSCRIPTION.SUSPENDED
 *   - BILLING.SUBSCRIPTION.EXPIRED
 *   - PAYMENT.SALE.COMPLETED
 *   - PAYMENT.SALE.DENIED
 *
 * Set PAYPAL_WEBHOOK_ID in env to the id PayPal assigns when you create the webhook.
 */
export async function POST(req: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    return NextResponse.json(
      { error: "PAYPAL_WEBHOOK_ID not configured" },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  let event: PaypalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaypalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const h = await headers();
  const authAlgo = h.get("paypal-auth-algo");
  const certUrl = h.get("paypal-cert-url");
  const transmissionId = h.get("paypal-transmission-id");
  const transmissionSig = h.get("paypal-transmission-sig");
  const transmissionTime = h.get("paypal-transmission-time");

  if (
    !authAlgo ||
    !certUrl ||
    !transmissionId ||
    !transmissionSig ||
    !transmissionTime
  ) {
    return NextResponse.json(
      { error: "Missing PayPal signature headers" },
      { status: 400 },
    );
  }

  const verified = await verifyWebhookSignature({
    authAlgo,
    certUrl,
    transmissionId,
    transmissionSig,
    transmissionTime,
    webhookId,
    body: event,
  });
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const db = getSupabase();

  // Idempotency: skip if we've already processed this event.
  const { data: existing } = await db
    .from("paypal_events")
    .select("event_id, processed_at")
    .eq("event_id", event.id)
    .maybeSingle();
  if (existing?.processed_at) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Log the event up front, even if processing fails below.
  await db.from("paypal_events").upsert(
    {
      event_id: event.id,
      event_type: event.event_type,
      resource_id: event.resource?.id ?? null,
      raw: event,
    },
    { onConflict: "event_id" },
  );

  try {
    await processEvent(event);
    await db
      .from("paypal_events")
      .update({ processed_at: new Date().toISOString(), error: null })
      .eq("event_id", event.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    await db
      .from("paypal_events")
      .update({ error: msg })
      .eq("event_id", event.id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

interface PaypalWebhookEvent {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    custom_id?: string;
    status?: string;
    billing_info?: PayPalSubscription["billing_info"];
    plan_id?: string;
  };
}

async function processEvent(event: PaypalWebhookEvent) {
  const db = getSupabase();
  const subscriptionId = event.resource?.id;
  if (!subscriptionId) return;

  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.UPDATED": {
      // Pull the freshest state from PayPal — webhooks can be slightly stale.
      const sub = await fetchSubscription(subscriptionId);
      const trial = sub.billing_info?.cycle_executions?.find(
        (c) => c.tenure_type === "TRIAL",
      );
      const stillInTrial = trial && trial.cycles_completed === 0;
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
      await db
        .from("subscriptions")
        .update({
          status,
          trial_ends_at: stillInTrial
            ? (sub.billing_info?.next_billing_time ?? null)
            : null,
          current_period_end: sub.billing_info?.next_billing_time ?? null,
        })
        .eq("paypal_subscription_id", subscriptionId);

      // Conversion: cancel pending audit drips so we stop pitching the
      // trial after they've already started one. Fire-and-forget.
      if (status === "trialing" || status === "active") {
        cancelDripsForSubscription(subscriptionId).catch((err) =>
          console.error("cancelDripsForSubscription failed:", err),
        );
      }
      return;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED": {
      const sub = await fetchSubscription(subscriptionId);
      await db
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          current_period_end: sub.billing_info?.next_billing_time ?? null,
        })
        .eq("paypal_subscription_id", subscriptionId);
      return;
    }

    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "PAYMENT.SALE.DENIED": {
      await db
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("paypal_subscription_id", subscriptionId);
      return;
    }

    case "BILLING.SUBSCRIPTION.EXPIRED": {
      await db
        .from("subscriptions")
        .update({ status: "expired", plan: "free" })
        .eq("paypal_subscription_id", subscriptionId);
      return;
    }

    case "PAYMENT.SALE.COMPLETED": {
      // A real payment landed — make sure we're marked active.
      const sub = await fetchSubscription(subscriptionId);
      await db
        .from("subscriptions")
        .update({
          status: "active",
          trial_ends_at: null,
          current_period_end: sub.billing_info?.next_billing_time ?? null,
        })
        .eq("paypal_subscription_id", subscriptionId);
      return;
    }

    default:
      // Unhandled event types are logged but don't fail.
      return;
  }
}

/**
 * Look up the user_id on a subscription row, resolve their auth email,
 * and cancel any pending audit drips for that address. Used when a
 * subscription transitions to trialing/active so we stop emailing them
 * "start a free trial" CTAs after they've already started one.
 */
async function cancelDripsForSubscription(
  paypalSubscriptionId: string,
): Promise<void> {
  const db = getSupabase();
  const { data: subRow } = await db
    .from("subscriptions")
    .select("user_id")
    .eq("paypal_subscription_id", paypalSubscriptionId)
    .maybeSingle();
  if (!subRow?.user_id) return;

  const { data: userRes } = await db.auth.admin.getUserById(subRow.user_id);
  const email = userRes?.user?.email;
  if (!email) return;

  await cancelPendingDrips(email);
}
