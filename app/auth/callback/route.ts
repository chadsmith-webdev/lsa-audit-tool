import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Default destination — will be overridden below if user is admin
  const response = NextResponse.redirect(`${origin}/dashboard`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto both the request and the response so the
          // session is available immediately on the next server render.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Use service role key to bypass RLS for the admin check
  const { createClient } = await import("@supabase/supabase-js");
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile, error: profileErr } = await adminDb
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    console.log("[auth/callback] profile lookup:", { profile, profileErr });

    if (profile?.is_admin) {
      // Mutate the existing response so session cookies are preserved
      response.headers.set("Location", `${origin}/admin`);
    }
  }

  return response;
}
