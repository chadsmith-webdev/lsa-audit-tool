/**
 * PayPal v2 REST client — thin wrapper over the Subscriptions API.
 *
 * Reads PAYPAL_ENV, PAYPAL_CLIENT_ID, PAYPAL_SECRET from process.env.
 * Set PAYPAL_ENV=sandbox for previews/dev and PAYPAL_ENV=live for production.
 */

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error(
      "PayPal not configured — set PAYPAL_CLIENT_ID and PAYPAL_SECRET",
    );
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal token request failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

interface PayPalSubscription {
  id: string;
  status: string;
  status_update_time?: string;
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
    cycle_executions?: Array<{
      tenure_type: "TRIAL" | "REGULAR";
      sequence: number;
      cycles_completed: number;
    }>;
  };
  plan_id?: string;
  subscriber?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  links?: Array<{ href: string; rel: string; method: string }>;
}

/**
 * Fetch a subscription by id. Used by webhooks + reconciliation jobs.
 */
export async function fetchSubscription(
  subscriptionId: string,
): Promise<PayPalSubscription> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) {
    throw new Error(
      `PayPal fetchSubscription failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as PayPalSubscription;
}

/**
 * Cancel a subscription with a reason.
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason: string,
): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    },
  );
  if (!res.ok && res.status !== 204) {
    throw new Error(
      `PayPal cancelSubscription failed: ${res.status} ${await res.text()}`,
    );
  }
}

/**
 * Verify a webhook signature. Required by PayPal to trust an incoming event.
 * Set PAYPAL_WEBHOOK_ID in env after creating the webhook in the PayPal dashboard.
 */
export async function verifyWebhookSignature(args: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  body: unknown;
}): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: args.authAlgo,
        cert_url: args.certUrl,
        transmission_id: args.transmissionId,
        transmission_sig: args.transmissionSig,
        transmission_time: args.transmissionTime,
        webhook_id: args.webhookId,
        webhook_event: args.body,
      }),
    },
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export { PAYPAL_BASE };
export type { PayPalSubscription };

/**
 * Plan identifier lookup. Set these in your env after creating PayPal plans
 * in the dashboard or via the Catalog Products + Plans API. Each plan should
 * have a 14-day TRIAL phase ($0) followed by the recurring REGULAR phase.
 */
export function getPlanId(args: {
  tier: "pro" | "multi_location";
  billing: "monthly" | "annual";
}): string | null {
  const key = `PAYPAL_PLAN_${args.tier.toUpperCase()}_${args.billing.toUpperCase()}`;
  return process.env[key] ?? null;
}
