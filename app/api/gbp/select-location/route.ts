import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSupabase } from "@/lib/supabase";

type Body = { accountName?: string; locationName?: string };

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const accountName = body.accountName?.trim();
  const locationName = body.locationName?.trim();
  if (!accountName || !locationName) {
    return NextResponse.json(
      { error: "accountName and locationName required" },
      { status: 400 },
    );
  }
  if (
    !accountName.startsWith("accounts/") ||
    !locationName.startsWith("locations/")
  ) {
    return NextResponse.json(
      { error: "Invalid resource name format" },
      { status: 400 },
    );
  }

  const db = getSupabase();
  const { error } = await db
    .from("gbp_connections")
    .update({ account_id: accountName, location_id: locationName })
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
