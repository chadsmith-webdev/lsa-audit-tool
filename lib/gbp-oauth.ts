/**
 * Google Business Profile OAuth helpers.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI   e.g. https://app.localsearchally.com/api/gbp/oauth/callback
 *
 * Scope: business.manage is "restricted" — Google requires app verification
 * for users outside the test list. See https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification
 */

export const GBP_SCOPE =
  "https://www.googleapis.com/auth/business.manage openid email";

export function getOAuthEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth env vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI)",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GBP_SCOPE,
    access_type: "offline",
    prompt: "consent", // force refresh_token issuance every time
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: "Bearer";
  id_token?: string;
};

export async function exchangeCodeForTokens(
  code: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = getOAuthEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

/** Decode a Google id_token payload without verifying signature (server-side, post-exchange). */
export function decodeIdTokenEmail(idToken?: string): string | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    ) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}
