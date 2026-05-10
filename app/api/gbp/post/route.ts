import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import {
  createLocalPost,
  ctaLabelToActionType,
  getAccessTokenForUser,
  getConnection,
} from "@/lib/gbp-api";

type Body = {
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

const POST_LIMIT = 1500;

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const headline = payload.headline?.trim() ?? "";
  const bodyText = payload.body?.trim() ?? "";
  if (!bodyText) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  // GBP stores headline + body as a single 'summary'. Concatenate.
  const summary = headline ? `${headline}\n\n${bodyText}` : bodyText;
  if (summary.length > POST_LIMIT) {
    return NextResponse.json(
      { error: `Post exceeds ${POST_LIMIT} characters.` },
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
  if (!conn.account_id || !conn.location_id) {
    return NextResponse.json(
      { error: "Pick a location first." },
      { status: 400 },
    );
  }

  const ctaActionType = payload.ctaLabel
    ? ctaLabelToActionType(payload.ctaLabel)
    : null;

  try {
    const accessToken = await getAccessTokenForUser(user.id);
    const result = await createLocalPost(accessToken, {
      accountName: conn.account_id,
      locationName: conn.location_id,
      summary,
      cta: ctaActionType
        ? { actionType: ctaActionType, url: payload.ctaUrl }
        : undefined,
    });

    if (!result.ok) {
      // Common in 2025-2026: v4 posting is restricted/deprecated for many accounts.
      const friendly =
        result.code === 404
          ? "Google's API doesn't allow posting from this account anymore. Copy the post and publish it inside Google Business Profile."
          : result.code === 403
            ? "Permission denied. Make sure this Google account owns the location."
            : `Google returned ${result.code}. Copy the post and publish manually.`;
      return NextResponse.json(
        { error: friendly, raw: result.message, fallback: "manual" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, postName: result.postName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Post failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
