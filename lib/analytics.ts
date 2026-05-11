/**
 * Shared analytics helper for audit.localsearchally.com.
 *
 * Wraps window.gtag so callers don't need to guard against it being
 * undefined. Safe to call on the server — it no-ops silently.
 *
 * Agreed event taxonomy (keep in sync with local-search-ally/src/lib/analytics.js):
 *
 *   audit_started          – user submitted the audit form
 *   audit_completed        – audit run finished
 *   email_captured         – user saved / emailed their report
 *   upgrade_clicked        – user clicked a paid-plan CTA
 *   signup_started         – user landed on /signup
 *   contact_form_submitted – contact form submitted (fired in marketing site)
 *   call_booked            – user clicked the Calendly booking link (marketing site)
 */

type GtagFn = (...args: unknown[]) => void;

/**
 * Fire a GA4 custom event.
 *
 * @param name    Event name — use the taxonomy above.
 * @param params  Optional event parameters.
 */
export function track(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  const g = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof g !== 'function') return;
  g('event', name, params);
}
