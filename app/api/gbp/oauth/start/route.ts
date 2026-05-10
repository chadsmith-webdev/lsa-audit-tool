import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { createServerClient } from "@/lib/supabase";
import { buildAuthUrl } from "@/lib/gbp-oauth";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL(
        "/login",
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      ),
    );
  }

  // CSRF state cookie — verified in the callback.
  const state = randomBytes(24).toString("hex");
  cookieStore.set("gbp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });

  return NextResponse.redirect(buildAuthUrl(state));
}
