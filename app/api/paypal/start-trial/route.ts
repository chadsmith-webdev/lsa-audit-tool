import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { getPlanId, PAYPAL_BASE } from "@/lib/paypal";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { tier?: string; billing?: string };
  try {
    body = (await req.json()) as { tier?: string; billing?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const tier = body.tier === "agency" ? "agency" : "pro";
  const billing = body.billing === "annual" ? "annual" : "monthly";

  const planId = getPlanId({ tier, billing });
  if (!planId) {
    return NextResponse.json(
      {
        error:
          "PayPal plan not configured. Set PAYPAL_PLAN_" +
          `${tier.toUpperCase()}_${billing.toUpperCase()} in env.`,
      },
      { status: 500 },
    );
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    return NextResponse.json(
      { error: "PayPal not configured" },
      { status: 500 },
    );
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  // 1. Get an access token.
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) {
    return NextResponse.json({ error: "PayPal auth failed" }, { status: 502 });
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // 2. Create the subscription.
  const subRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${user.id}-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: user.id,
      subscriber: {
        email_address: user.email,
      },
      application_context: {
        brand_name: "Local Search Ally",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${origin}/api/paypal/return?tier=${tier}&billing=${billing}`,
        cancel_url: `${origin}/pricing?cancelled=1`,
      },
    }),
  });

  if (!subRes.ok) {
    const text = await subRes.text();
    return NextResponse.json(
      { error: "PayPal subscription create failed", detail: text },
      { status: 502 },
    );
  }
  const sub = (await subRes.json()) as {
    id: string;
    status: string;
    links: Array<{ href: string; rel: string }>;
  };

  const approve = sub.links.find((l) => l.rel === "approve")?.href;
  if (!approve) {
    return NextResponse.json(
      { error: "No PayPal approval URL returned" },
      { status: 502 },
    );
  }

  // 3. Stash the pending subscription. Webhook + return route confirm it.
  const db = getSupabase();
  await db
    .from("subscriptions")
    .update({
      paypal_subscription_id: sub.id,
      plan: tier,
      billing,
      status: "inactive", // becomes 'trialing' after PayPal confirms
      early_adopter: billing === "annual",
    })
    .eq("user_id", user.id);

  return NextResponse.json({ approveUrl: approve, subscriptionId: sub.id });
}
