import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";
import { decodeIdTokenEmail, exchangeCodeForTokens } from "@/lib/gbp-oauth";

const TOOL_URL = "/dashboard/tools/gbp";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gbp_oauth_state")?.value;
  cookieStore.set("gbp_oauth_state", "", { maxAge: 0, path: "/" });

  if (oauthError) {
    return NextResponse.redirect(new URL(`${TOOL_URL}?gbp=denied`, origin));
  }
  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(
      new URL(`${TOOL_URL}?gbp=state_mismatch`, origin),
    );
  }

  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("GBP oauth token exchange failed:", err);
    return NextResponse.redirect(
      new URL(`${TOOL_URL}?gbp=exchange_failed`, origin),
    );
  }

  const googleEmail = decodeIdTokenEmail(tokens.id_token) ?? "";
  if (!tokens.refresh_token) {
    // Without prompt=consent users who previously connected won't get a new
    // refresh_token. We force prompt=consent in start, so this path is rare.
    return NextResponse.redirect(new URL(`${TOOL_URL}?gbp=no_refresh`, origin));
  }

  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();

  const db = getSupabase();
  const { error } = await db.from("gbp_connections").upsert(
    {
      user_id: user.id,
      google_email: googleEmail,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      token_expires_at: expiresAt,
      scope: tokens.scope,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("GBP connection upsert failed:", error);
    return NextResponse.redirect(new URL(`${TOOL_URL}?gbp=db_error`, origin));
  }

  return NextResponse.redirect(new URL(`${TOOL_URL}?gbp=connected`, origin));
}
