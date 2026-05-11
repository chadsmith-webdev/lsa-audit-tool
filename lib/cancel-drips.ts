import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";

/**
 * Cancel any future Resend drip emails queued for an email address.
 *
 * Called when a lead converts — starts a free trial, becomes active, etc.
 * Without this, the 6 follow-ups scheduled by /api/email keep firing after
 * the user has already signed up, which contradicts every CTA in them.
 *
 * Safe to call multiple times. Best-effort: any per-id failure is logged
 * but does not throw — we don't want to block subscription flows on a
 * Resend API hiccup.
 */
export async function cancelPendingDrips(email: string): Promise<{
  cancelled: number;
  failed: number;
}> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { cancelled: 0, failed: 0 };

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { cancelled: 0, failed: 0 };

  const db = getSupabase();
  const { data: rows, error } = await db
    .from("scheduled_drips")
    .select("id, resend_id")
    .ilike("email", normalized)
    .is("cancelled_at", null);

  if (error) {
    console.error("cancelPendingDrips: query failed", error);
    return { cancelled: 0, failed: 0 };
  }
  if (!rows || rows.length === 0) return { cancelled: 0, failed: 0 };

  const resend = new Resend(resendKey);
  let cancelled = 0;
  let failed = 0;
  const cancelledIds: number[] = [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        await resend.emails.cancel(row.resend_id);
        cancelled += 1;
        cancelledIds.push(row.id);
      } catch (err) {
        // Resend returns 404/400 if the email already sent — mark it
        // cancelled locally anyway so we stop trying.
        failed += 1;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `cancelPendingDrips: cancel failed for ${row.resend_id}: ${msg}`,
        );
        cancelledIds.push(row.id);
      }
    }),
  );

  if (cancelledIds.length > 0) {
    await db
      .from("scheduled_drips")
      .update({ cancelled_at: new Date().toISOString() })
      .in("id", cancelledIds);
  }

  return { cancelled, failed };
}
