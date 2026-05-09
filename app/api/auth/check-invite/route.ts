import { type NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
  } catch {
    return NextResponse.json({ allowed: false }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ allowed: false }, { status: 400 });
  }

  const db = getSupabase();
  const { data, error } = await db
    .from("invited_emails")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[check-invite]", error.message);
    return NextResponse.json({ allowed: false }, { status: 500 });
  }

  return NextResponse.json({ allowed: !!data });
}
