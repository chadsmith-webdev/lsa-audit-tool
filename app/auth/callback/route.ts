import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Capture session cookies so we can apply them to the final redirect.
  // We can't create the redirect response first because mutating its Location
  // header afterwards is unreliable in Next.js 15.
  const pendingCookies: { name: string; value: string; options?: object }[] = [];

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
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Determine destination before creating the response
  let destination = `${origin}/dashboard`;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { createClient } = await import("@supabase/supabase-js");
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

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
