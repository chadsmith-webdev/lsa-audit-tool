import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import {
  getAccessTokenForUser,
  getConnection,
  updateDescription,
} from "@/lib/gbp-api";

const GBP_LIMIT = 750;

type Body = { description?: string };

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

  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json(
      { error: "description required" },
      { status: 400 },
    );
  }
  if (description.length > GBP_LIMIT) {
    return NextResponse.json(
      { error: `Description exceeds ${GBP_LIMIT} characters.` },
      { status: 400 },
    );
  }

  const conn = await getConnection(user.id);
  if (!conn) {
    return NextResponse.json(
      { error: "Not connected to Google Business Profile" },
      { status: 400 },
    );
  }
  if (!conn.location_id) {
    return NextResponse.json(
      { error: "Pick a location first." },
      { status: 400 },
    );
  }

  try {
    const accessToken = await getAccessTokenForUser(user.id);
    const result = await updateDescription(
      accessToken,
      conn.location_id,
      description,
    );
    return NextResponse.json({ ok: true, description: result.description });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
