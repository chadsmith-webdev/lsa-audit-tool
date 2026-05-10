import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const { error } = await db
    .from("gbp_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort revoke at Google. We don't block on failure — the row is gone.
  // (Skipped here to avoid a blocking fetch; a future job can reconcile.)

  return NextResponse.json({ ok: true });
}
