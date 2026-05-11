import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import {
  getUserPlan,
  hasProAccess,
  type EffectivePlan,
} from "@/lib/subscription";

/**
 * Server-side gate for Pro Tool pages.
 *
 * Call this right after auth check. If the user doesn't have an active Pro or
 * Agency plan (paying OR in trial), they're redirected to /pricing with a
 * tool slug so the pricing page can highlight what they were trying to access.
 *
 * Returns the resolved plan so callers can show trial countdowns etc.
 */
export async function requireProAccess(
  userId: string,
  toolSlug?: string,
): Promise<EffectivePlan> {
  const plan = await getUserPlan(userId);
  if (!hasProAccess(plan)) {
    const target = toolSlug
      ? `/pricing?gate=${encodeURIComponent(toolSlug)}`
      : "/pricing?gate=1";
    redirect(target);
  }
  return plan;
}

/**
 * API-route variant: returns a 402 NextResponse if the user lacks Pro access,
 * otherwise returns null and the route can continue. Use after the existing
 * auth check inside POST/GET handlers under /api/tools/*.
 *
 *   const gate = await proGateApi(user.id);
 *   if (gate) return gate;
 */
export async function proGateApi(userId: string): Promise<NextResponse | null> {
  const plan = await getUserPlan(userId);
  if (!hasProAccess(plan)) {
    return NextResponse.json(
      {
        error: "Pro plan required",
        reason: "no_active_subscription",
        upgrade_url: "/pricing",
      },
      { status: 402 },
    );
  }
  return null;
}
