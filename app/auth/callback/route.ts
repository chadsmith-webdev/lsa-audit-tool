import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cancelPendingDrips } from "@/lib/cancel-drips";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const pendingAuditId = searchParams.get("pending_audit");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Capture session cookies so we can apply them to the final redirect.
  // We can't create the redirect response first because mutating its Location
  // header afterwards is unreliable in Next.js 15.
  const pendingCookies: { name: string; value: string; options?: object }[] =
    [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Make session readable within this same request
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Stash for the final response
          cookiesToSet.forEach((c) => pendingCookies.push(c));
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "[auth/callback] exchangeCodeForSession error:",
      error.message,
    );
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Determine destination before creating the response
  let destination = `${origin}/dashboard`;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // Cancel any pending drip emails so converted users don't keep receiving
    // "start your free trial" CTAs. Fire-and-forget — don't block the redirect.
    if (user.email) {
      cancelPendingDrips(user.email).catch((err) =>
        console.error("[auth/callback] cancelPendingDrips failed:", err),
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    // Claim a pending audit (run anonymously before login) for this user.
    // We only attach audits that don't already have an owner — never reassign.
    if (pendingAuditId) {
      const { error: claimErr } = await adminDb
        .from("audits")
        .update({ user_id: user.id })
        .eq("id", pendingAuditId)
        .is("user_id", null);
      if (claimErr) {
        console.error(
          "[auth/callback] pending audit claim failed:",
          claimErr.message,
        );
      }
    }

    const { data: profile, error: profileErr } = await adminDb
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    console.log("[auth/callback] profile lookup:", { profile, profileErr });

    if (profile?.is_admin) {
      destination = `${origin}/admin`;
    }
  }

  // Create the redirect with the correct destination, then attach session cookies
  const response = NextResponse.redirect(destination);
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options ?? {}),
  );

  return response;
}
