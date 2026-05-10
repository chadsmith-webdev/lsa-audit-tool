/**
 * Google Business Profile API client.
 * All calls use a short-lived access_token resolved from the stored refresh_token.
 *
 * API surfaces:
 *  - Account Management API   (mybusinessaccountmanagement.googleapis.com/v1)
 *  - Business Information API (mybusinessbusinessinformation.googleapis.com/v1)
 *  - Legacy v4 (mybusiness.googleapis.com/v4) — local posts only; deprecated.
 *    May return NOT_FOUND for accounts without posting access; callers handle gracefully.
 */

import { getSupabase } from "@/lib/supabase";
import { refreshAccessToken } from "@/lib/gbp-oauth";

const ACCT_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const POSTS_API = "https://mybusiness.googleapis.com/v4";

export type GbpConnection = {
  user_id: string;
  google_email: string;
  refresh_token: string;
  access_token: string | null;
  token_expires_at: string | null;
  account_id: string | null;
  location_id: string | null;
};

export async function getConnection(
  userId: string,
): Promise<GbpConnection | null> {
  const db = getSupabase();
  const { data } = await db
    .from("gbp_connections")
    .select(
      "user_id, google_email, refresh_token, access_token, token_expires_at, account_id, location_id",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return (data as GbpConnection | null) ?? null;
}

/**
 * Returns a valid access_token, refreshing + persisting if expired or within 60s of expiry.
 */
export async function getAccessTokenForUser(userId: string): Promise<string> {
  const conn = await getConnection(userId);
  if (!conn) throw new Error("Not connected to Google Business Profile");

  const now = Date.now();
  const exp = conn.token_expires_at
    ? new Date(conn.token_expires_at).getTime()
    : 0;
  if (conn.access_token && exp - now > 60_000) {
    return conn.access_token;
  }

  const refreshed = await refreshAccessToken(conn.refresh_token);
  const newExp = new Date(now + refreshed.expires_in * 1000).toISOString();

  const db = getSupabase();
  await db
    .from("gbp_connections")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExp,
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}

/* ----------------------------- Locations ----------------------------- */

export type GbpLocation = {
  /** Resource name: "locations/123..." */
  name: string;
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
};

export type GbpAccount = {
  /** Resource name: "accounts/123..." */
  name: string;
  accountName?: string;
  type?: string;
};

/** Typed error so API routes can surface friendly messages + correct HTTP status. */
export class GbpApiError extends Error {
  status: number;
  raw: string;
  constructor(status: number, raw: string, friendly: string) {
    super(friendly);
    this.name = "GbpApiError";
    this.status = status;
    this.raw = raw;
  }
}

function friendlyFor(status: number, endpoint: string): string {
  if (status === 429) {
    return "Google Business Profile API quota is 0 for this project. Request access at https://developers.google.com/my-business/content/prereqs (1-2 business day approval).";
  }
  if (status === 403) {
    return "Permission denied by Google. The connected account may not have access to this resource.";
  }
  if (status === 401) {
    return "Google token rejected. Disconnect and reconnect Google Business Profile.";
  }
  if (status === 404) {
    return "Not found on Google. The account or location may have been removed.";
  }
  return `Google API ${endpoint} failed (${status}).`;
}

export async function listAccounts(accessToken: string): Promise<GbpAccount[]> {
  const res = await fetch(`${ACCT_API}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const raw = await res.text();
    throw new GbpApiError(
      res.status,
      raw,
      friendlyFor(res.status, "listAccounts"),
    );
  }
  const data = (await res.json()) as { accounts?: GbpAccount[] };
  return data.accounts ?? [];
}

export async function listLocationsForAccount(
  accessToken: string,
  accountName: string,
): Promise<GbpLocation[]> {
  // readMask required.
  const url = new URL(`${INFO_API}/${accountName}/locations`);
  url.searchParams.set("readMask", "name,title,storefrontAddress");
  url.searchParams.set("pageSize", "100");

  const out: GbpLocation[] = [];
  let pageToken: string | undefined;
  do {
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const raw = await res.text();
      throw new GbpApiError(
        res.status,
        raw,
        friendlyFor(res.status, "listLocations"),
      );
    }
    const data = (await res.json()) as {
      locations?: GbpLocation[];
      nextPageToken?: string;
    };
    if (data.locations) out.push(...data.locations);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return out;
}

/** Combined: returns [{ account, location }] pairs across all accounts the user can access. */
export async function listAllLocations(
  accessToken: string,
): Promise<{ account: GbpAccount; location: GbpLocation }[]> {
  const accounts = await listAccounts(accessToken);
  const pairs: { account: GbpAccount; location: GbpLocation }[] = [];
  for (const account of accounts) {
    try {
      const locs = await listLocationsForAccount(accessToken, account.name);
      for (const location of locs) {
        pairs.push({ account, location });
      }
    } catch (err) {
      // Some accounts (e.g. personal accounts with no GBP) 404 on listLocations.
      console.warn("listLocationsForAccount failed for", account.name, err);
    }
  }
  return pairs;
}

/* -------------------------- Update description -------------------------- */

export async function updateDescription(
  accessToken: string,
  locationName: string, // "locations/123..."
  description: string,
): Promise<{ description: string }> {
  const url = `${INFO_API}/${locationName}?updateMask=profile.description`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profile: { description } }),
  });
  if (!res.ok) {
    const raw = await res.text();
    throw new GbpApiError(
      res.status,
      raw,
      friendlyFor(res.status, "updateDescription"),
    );
  }
  const data = (await res.json()) as { profile?: { description?: string } };
  return { description: data.profile?.description ?? description };
}

/* ----------------------------- Local posts ----------------------------- */
/**
 * Create a post on Google Business Profile via the deprecated v4 endpoint.
 * Returns { ok: true, postName } on success.
 * Returns { ok: false, code, message } on failure (404 = posting not available
 * to this account; common in 2025-2026).
 */
export type CreatePostInput = {
  accountName: string; // "accounts/123..."
  locationName: string; // "locations/456..."
  summary: string;
  cta?: { actionType: string; url?: string };
};

export type CreatePostResult =
  | { ok: true; postName: string }
  | { ok: false; code: number; message: string };

const CTA_MAP: Record<string, string> = {
  "Call now": "CALL",
  "Book online": "BOOK",
  "Get offer": "GET_OFFER",
  "Learn more": "LEARN_MORE",
  "Sign up": "SIGN_UP",
  "Order online": "ORDER",
};

export function ctaLabelToActionType(label: string): string | null {
  return CTA_MAP[label] ?? null;
}

export async function createLocalPost(
  accessToken: string,
  input: CreatePostInput,
): Promise<CreatePostResult> {
  const parent = `${input.accountName}/${input.locationName}`;
  const url = `${POSTS_API}/${parent}/localPosts`;
  const body: Record<string, unknown> = {
    languageCode: "en",
    summary: input.summary,
    topicType: "STANDARD",
  };
  if (input.cta) {
    body.callToAction = {
      actionType: input.cta.actionType,
      ...(input.cta.url ? { url: input.cta.url } : {}),
    };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, code: res.status, message: text };
  }
  const data = (await res.json()) as { name?: string };
  return { ok: true, postName: data.name ?? "" };
}
