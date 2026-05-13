import { type NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import type { AuditResult, AuditSection, AuditInput } from "@/lib/types";

/**
 * Save & Monitor signup endpoint.
 *
 * Triggered from the post-audit "Save & Monitor" card. Unlike `/api/auth/check-invite`
 * (which gates an existing closed-beta invite list), this endpoint *opens* signup —
 * it auto-adds the email to `invited_emails` so the magic-link flow can complete.
 *
 * The pending audit ID rides through the magic-link redirect and is claimed for
 * the user inside `/auth/callback`.
 */
export async function POST(request: NextRequest) {
  let email = "";
  let auditId: string | null = null;

  try {
    const body = await request.json();
    email =
      typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    auditId = typeof body?.auditId === "string" ? body.auditId : null;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  // 1. Idempotently allow this email through the invite gate so OTP succeeds.
  try {
    const db = getSupabase();
    const { error: inviteErr } = await db
      .from("invited_emails")
      .upsert({ email }, { onConflict: "email" });
    if (inviteErr) {
      console.error("[save-audit] invite upsert failed:", inviteErr.message);
    }
  } catch (err) {
    console.error("[save-audit] invite upsert exception:", err);
  }

  // 2. Send magic link via service role (bypasses any client-side gating).
  // The `redirectTo` carries the pending audit so /auth/callback can claim it.
  const params = new URLSearchParams();
  if (auditId) params.set("pending_audit", auditId);
  const redirectTo = `${siteUrl}/auth/callback${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    const { error: otpErr } = await admin.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (otpErr) {
      console.error("[save-audit] signInWithOtp failed:", otpErr.message);
      return NextResponse.json(
        { error: "Couldn't send the magic link. Try again or contact Chad." },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("[save-audit] OTP exception:", err);
    return NextResponse.json(
      { error: "Couldn't send the magic link. Try again or contact Chad." },
      { status: 500 },
    );
  }

  // Enroll in drip sequence fire-and-forget.
  // If the user never clicks the magic link, they still get follow-up emails.
  // cancelPendingDrips() in auth/callback cancels these when they convert.
  if (auditId) {
    const userIp =
      (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      "anonymous";
    const db = getSupabase();
    (async () => {
      try {
        const { data: auditRow } = await db
          .from("audits")
          .select("result, input")
          .eq("id", auditId)
          .single();
        if (!auditRow?.result || !auditRow?.input) return;

        const result = auditRow.result as AuditResult;
        const input = auditRow.input as AuditInput;
        const lowestSection = result.sections?.length
          ? result.sections.reduce((a: AuditSection, b: AuditSection) =>
              a.score < b.score ? a : b,
            ).id
          : "";

        await fetch(`${siteUrl}/api/email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": userIp,
          },
          body: JSON.stringify({
            email,
            auditId,
            businessName: result.business_name,
            trade: input.primaryTrade,
            city: input.serviceCity,
            scoreBucket: result.overall_label,
            overallScore: result.overall_score,
            lowestSection,
          }),
        });
      } catch (err) {
        console.error("[save-audit] drip enrollment failed:", err);
      }
    })();
  }

  return NextResponse.json({ ok: true });
}
