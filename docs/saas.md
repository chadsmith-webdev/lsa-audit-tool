# **Local Search Ally SaaS — Build Spec**

**The authenticated product that wraps the free audit funnel.**

> The free audit tool itself (form, prompt, prefetch pipeline, PDF, email
> drip) is documented in [`audit-tool.md`](./audit-tool.md). This file covers
> everything around it: auth, billing, dashboard, Pro tools, GBP OAuth,
> geo-grid, and the admin/client portal.

---

## **1. What This Is**

A $49/mo (or $39/mo annual) subscription product for NWA contractors that
turns the one-shot free audit into an ongoing local-SEO workstation:

- Persistent dashboard with the user's latest audit + 8 Pro tool widgets
- Geo-grid Map Pack rank tracker (DataForSEO)
- GBP OAuth connection (read profile + post updates without leaving the app)
- Admin/client portal for Chad to manage individual customers
- 14-day free trial via PayPal Subscriptions, then $49/mo or $390/yr
- Invite-only signup (`invited_emails` allowlist) during early-adopter phase

The free audit at `localsearchally.com` is the top of funnel; the SaaS lives
at `/dashboard`, `/pricing`, etc.

---

## **2. Plans & Access Tiers**

Source of truth: [`lib/subscription.ts`](../lib/subscription.ts).

| Plan             | Price (monthly / annual) | What's included                                            |
| ---------------- | ------------------------ | ---------------------------------------------------------- |
| `free`           | $0                       | Free audit only — all Pro tools locked                     |
| `pro`            | $49 / $39 (×12 = $468)   | Unlimited audits + all 8 Pro tools + 1 location + geo-grid |
| `multi_location` | TBD                      | Everything in Pro + up to 10 locations + white-label       |

### Status → access mapping

Granted Pro access:

- `trialing` — inside the 14-day trial window (`trial_ends_at > now`)
- `active` — paying
- `cancelled` — cancelled but still inside the paid period (`current_period_end > now`)

No Pro access:

- `inactive`, `past_due`, `expired`

The `EffectivePlan.effective` field is what every gate checks — never trust
the raw `plan` column on its own.

> The plan tier `agency` was renamed to `multi_location` in migration
> [`20260511_rename_agency_to_multi_location.sql`](../supabase/migrations/20260511_rename_agency_to_multi_location.sql).
> The product is positioned for operators, not marketing agencies.

---

## **3. Authentication**

**Provider:** Supabase Auth — magic-link email only, no password.

**Files:**

- [`app/login/LoginForm.tsx`](../app/login/LoginForm.tsx) — magic-link form
- [`app/auth/callback/route.ts`](../app/auth/callback/route.ts) — exchanges the code, ensures a `profiles` row exists
- [`app/auth/signout/route.ts`](../app/auth/signout/route.ts) — POST to sign out
- [`app/api/auth/check-invite/route.ts`](../app/api/auth/check-invite/route.ts) — pre-flight check on the email before the magic link is sent

### Invite-only gate

During the early-adopter phase, the login form first POSTs the email to
`/api/auth/check-invite`. If the email isn't in `public.invited_emails`, the
magic link is refused with a "not on the list" message. Admins (rows in
`profiles` with `is_admin = true`) bypass the check.

Admin emails are seeded directly in
[`supabase/migrations/20260508_client_portal.sql`](../supabase/migrations/20260508_client_portal.sql).

### Session usage

- **Server components / API routes:** `createServerClient(cookies())` from `lib/supabase.ts` — uses the user's cookie session
- **Server-only privileged operations:** `getSupabase()` — service-role client, bypasses RLS, must never reach the browser

The exported `supabase` constant is a deprecated proxy kept for backwards
compatibility. New code uses `getSupabase()`.

---

## **4. Database Schema**

Migrations live in [`supabase/migrations/`](../supabase/migrations/). Run them
in the Supabase SQL editor in order.

| Migration                                      | Adds                                                        |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `20260508_client_portal.sql`                   | `profiles`, `invited_emails`, `grid_scans`, audit `user_id` |
| `20260510_subscriptions.sql`                   | `subscriptions` table + PayPal lifecycle columns            |
| `20260510_gbp_connections.sql`                 | `gbp_connections` (refresh tokens, selected location)       |
| `20260511_rename_agency_to_multi_location.sql` | Renames the plan tier                                       |

### Key tables

**`profiles`** — one row per `auth.users` row, auto-created via trigger. Stores
`business_name` and `is_admin`.

**`invited_emails`** — allowlist for early-adopter signup. `email` is unique.
Admins bypass this check.

**`audits`** — extended from the free-funnel schema with:

```sql
alter table public.audits add column user_id uuid references auth.users (id);
-- Plus GBP snapshot columns for dashboard widgets without re-running Claude:
gbp_found        boolean
gbp_rating       numeric
gbp_review_count int
gbp_photo_count  int
gbp_has_hours    boolean
```

When `/api/audit` runs with a logged-in session, the resulting row carries
`user_id` so it shows up in `/dashboard`. Anonymous audits leave `user_id`
null.

**`subscriptions`** — one row per user. Tracks PayPal subscription lifecycle.
Indexed on `user_id`, `status`, and `paypal_subscription_id`. See
[`20260510_subscriptions.sql`](../supabase/migrations/20260510_subscriptions.sql)
for the full schema.

**`gbp_connections`** — one row per user (unique on `user_id`). Stores
refresh + access tokens for Google Business Profile API. RLS allows
`select` for the owning user but only the service-role client ever reads
token columns.

**`grid_scans`** — geo-grid rank tracker results.

---

## **5. Billing — PayPal Subscriptions**

PayPal client: [`lib/paypal.ts`](../lib/paypal.ts). Sandbox vs live picked
via `PAYPAL_ENV`.

### Plan IDs (env)

```
PAYPAL_PLAN_PRO_MONTHLY=P-...
PAYPAL_PLAN_PRO_ANNUAL=P-...
PAYPAL_PLAN_MULTI_LOCATION_MONTHLY=P-...
PAYPAL_PLAN_MULTI_LOCATION_ANNUAL=P-...
```

`getPlanId({ tier, billing })` resolves one of these.

### Start trial flow

1. `POST /api/paypal/start-trial` (user must be signed in). Body: `{ tier, billing }`.
2. Server creates a PayPal subscription via the v2 REST API with a 14-day trial period.
3. Returns the approval URL. Frontend ([`StartTrialButton.tsx`](../app/signup/StartTrialButton.tsx)) redirects the user to PayPal.
4. PayPal redirects back to `/api/paypal/return?subscription_id=...` (success) or `/pricing?cancelled=1` (decline).
5. `/api/paypal/return` fetches the subscription, inserts/updates the `subscriptions` row with `status=trialing` and `trial_ends_at`, then redirects to `/dashboard?welcome=trial`.

### Webhook

`/api/paypal/webhook` ingests these events:

- `BILLING.SUBSCRIPTION.ACTIVATED` → `status=active`
- `BILLING.SUBSCRIPTION.UPDATED` → re-fetch and reconcile
- `BILLING.SUBSCRIPTION.CANCELLED` → `status=cancelled`, keep `current_period_end`
- `BILLING.SUBSCRIPTION.SUSPENDED` → `status=past_due`
- `BILLING.SUBSCRIPTION.EXPIRED` → `status=expired`
- `PAYMENT.SALE.COMPLETED` / `PAYMENT.SALE.DENIED` → period rollover / dunning

Signatures are verified via the v1 `notifications/verify-webhook-signature`
endpoint using `PAYPAL_WEBHOOK_ID`.

### Reconciliation cron

[`/api/cron/reconcile-paypal`](../app/api/cron/reconcile-paypal/route.ts)
walks every subscription with a `paypal_subscription_id` whose status is
`trialing | active | past_due | cancelled`, refetches state from PayPal, and
rewrites the row. Safety net for missed webhooks.

- Scheduled by [`vercel.json`](../vercel.json) at `17 3 * * *` (daily ~03:17 UTC).
- Auth via `Authorization: Bearer ${CRON_SECRET}` header.

---

## **6. Access Gates**

[`lib/require-pro.ts`](../lib/require-pro.ts) provides two helpers:

```ts
// Server-component / page gate — redirects to /pricing?gate=<slug>
const plan = await requireProAccess(user.id, "ai-citability");

// API-route gate — returns a 402 NextResponse if denied
const gate = await proGateApi(user.id);
if (gate) return gate;
```

`hasProAccess()` in `lib/subscription.ts` is the single boolean source of
truth used by both. The `?gate=<slug>` query param tells the pricing page
which tool the user was trying to reach, so the upgrade banner can name it
specifically (see `GATE_TOOL_NAMES` in
[`app/pricing/PricingClient.tsx`](../app/pricing/PricingClient.tsx)).

---

## **7. Dashboard**

**Route:** `/dashboard` — [`app/dashboard/page.tsx`](../app/dashboard/page.tsx)
(server component).

Fetches in parallel:

1. The user's last 50 audits (lightweight columns + GBP snapshot)
2. Last 20 grid scans
3. The latest audit's full `result` JSON (for the widget grid)

Widgets shown for each audit section, mapped from the latest result:

| Section         | Component            | API route (Pro)            |
| --------------- | -------------------- | -------------------------- |
| `gbp`           | `GBPWidget`          | `/api/tools/gbp`           |
| `citations`     | `CitationsWidget`    | `/api/tools/citations`     |
| `reviews`       | `ReviewsWidget`      | _(read-only widget)_       |
| `competitors`   | `CompetitorsWidget`  | `/api/tools/competitors`   |
| `backlinks`     | `BacklinksWidget`    | `/api/tools/backlinks`     |
| `onpage`        | `OnPageWidget`       | `/api/tools/onpage`        |
| `technical`     | `TechnicalWidget`    | `/api/tools/technical`     |
| `ai_citability` | `AICitabilityWidget` | `/api/tools/ai-citability` |

Free-plan users see the widgets locked behind `UpgradeSlot`, which links to
`/pricing?gate=<section>`.

The dashboard nav also surfaces a **trial welcome banner** when the `?welcome=trial`
query param is set and `plan.status === "trialing"`.

---

## **8. Pro Tools**

Each Pro tool has matching `app/dashboard/tools/<slug>/page.tsx` +
`app/api/tools/<slug>/route.ts`. Both call `requireProAccess` /
`proGateApi` first.

| Slug            | Page                                     | API                                | What it does                                                |
| --------------- | ---------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `gbp`           | `dashboard/tools/gbp/page.tsx`           | `api/tools/gbp/route.ts`           | GBP audit + optimizer recommendations                       |
| `citations`     | `dashboard/tools/citations/page.tsx`     | `api/tools/citations/route.ts`     | NAP audit across Yelp/BBB/Angi/HomeAdvisor + directory list |
| `reviews`       | `dashboard/tools/reviews/page.tsx`       | _(none — uses prefetch only)_      | Review feed + response status                               |
| `competitors`   | `dashboard/tools/competitors/page.tsx`   | `api/tools/competitors/route.ts`   | Map-pack competitor teardown                                |
| `backlinks`     | `dashboard/tools/backlinks/page.tsx`     | `api/tools/backlinks/route.ts`     | Domain rank, referring domains, outreach targets            |
| `onpage`        | `dashboard/tools/onpage/page.tsx`        | `api/tools/onpage/route.ts`        | Title/meta/heading fixes per page                           |
| `technical`     | `dashboard/tools/technical/page.tsx`     | `api/tools/technical/route.ts`     | CWV, HTTPS, sitemap, schema checks                          |
| `ai-citability` | `dashboard/tools/ai-citability/page.tsx` | `api/tools/ai-citability/route.ts` | AI-search visibility: grounding, photo freshness, schema    |

Tool helpers (citation directory list, GBP optimizer rules) live in
[`lib/tools/`](../lib/tools/).

---

## **9. Geo-Grid Rank Tracker**

**Page:** [`app/dashboard/grid/page.tsx`](../app/dashboard/grid/page.tsx)
**API:** [`app/api/grid/route.ts`](../app/api/grid/route.ts)
**Lib:** [`lib/grid.ts`](../lib/grid.ts) (grid math), [`app/components/GeoGrid.tsx`](../app/components/GeoGrid.tsx), [`GeoGridMap.tsx`](../app/components/GeoGridMap.tsx) (Leaflet view)

Runs a 5×5 grid (25 points, 1-mile radius each) against DataForSEO Google
Maps SERP, scoring the user's business rank at each point for a given
keyword. Results persist to `grid_scans`.

- DataForSEO endpoint: `serp/google/maps/live/advanced`
- Batched at 5 requests in flight, 1s delay between batches, to stay under rate limits
- Each cell stores `{ rank, competitors }`; cells with rank > 20 are treated as "not found"

Pro-only.

---

## **10. GBP OAuth Integration**

**Routes:**

- `POST /api/gbp/oauth/start` — kicks off the Google OAuth consent flow
- `GET /api/gbp/oauth/callback` — exchanges code for refresh token, writes to `gbp_connections`
- `GET /api/gbp/locations` — list locations on the connected account
- `POST /api/gbp/select-location` — persist the active `account_id` + `location_id`
- `POST /api/gbp/post` — publish a GBP post to the selected location
- `POST /api/gbp/update-description` — update the GBP business description
- `POST /api/gbp/disconnect` — delete the connection row

**Helpers:**
[`lib/gbp-oauth.ts`](../lib/gbp-oauth.ts) (token exchange + refresh),
[`lib/gbp-api.ts`](../lib/gbp-api.ts) (GBP REST calls).

**Token isolation:** Refresh tokens are written by service role only.
`gbp_connections` has RLS enabled. Tokens never round-trip to the client.

---

## **11. Admin / Client Portal**

**Route:** `/admin` — [`app/admin/page.tsx`](../app/admin/page.tsx)
**Client view:** `/admin/client/[id]` —
[`app/admin/client/[id]/page.tsx`](../app/admin/client/[id]/page.tsx)

`is_admin = true` on the `profiles` row is required. Non-admins redirect to
`/dashboard`. Admin status is checked via the service-role client to avoid
RLS false negatives.

The admin landing page lists all users with their plan + status; the client
detail view shows a single user's audits, subscription, and GBP connection.

---

## **12. Audit Ownership & Deletion**

- A logged-in audit run associates the resulting row to `user_id`.
- The dashboard lists those rows.
- [`app/components/DeleteAuditButton.tsx`](../app/components/DeleteAuditButton.tsx) calls the [`deleteAudit`](../app/actions/deleteAudit.ts) server action, which deletes the row if `user_id` matches the current session. Anonymous audits cannot be deleted from the UI.

---

## **13. Environment Variables (SaaS-specific)**

In addition to the free-funnel vars in [`audit-tool.md` §14](./audit-tool.md#14-environment-variables):

```
# Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...       # Client + cookie session
SUPABASE_SERVICE_KEY=eyJ...                 # Server-only — bypasses RLS

# PayPal
PAYPAL_ENV=sandbox                          # or "live"
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_WEBHOOK_ID=...
PAYPAL_PLAN_PRO_MONTHLY=P-...
PAYPAL_PLAN_PRO_ANNUAL=P-...
PAYPAL_PLAN_MULTI_LOCATION_MONTHLY=P-...
PAYPAL_PLAN_MULTI_LOCATION_ANNUAL=P-...

# Cron
CRON_SECRET=...                             # Bearer secret for /api/cron/*

# Google OAuth (GBP)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://localsearchally.com/api/gbp/oauth/callback
```

---

## **14. Current State (May 2026)**

- Free audit funnel: live in production, 8 audit sections (incl. `ai_citability`), home page at `localsearchally.com`.
- Supabase auth (magic link) with invite-only allowlist — live.
- PayPal Subscriptions with 14-day trial: live in sandbox, plan IDs configured for `pro` monthly/annual. `multi_location` plan IDs reserved but not yet active.
- Daily PayPal reconciliation cron live via `vercel.json`.
- Dashboard with 8 widgets + audit history: live.
- 8 Pro tools scaffolded (`app/dashboard/tools/*`, `app/api/tools/*`); product depth varies by tool.
- Geo-grid rank tracker live; Leaflet map view; 5×5 grid against DataForSEO Maps SERP.
- GBP OAuth + post + update-description: implemented (`/api/gbp/*`).
- Admin portal live (`/admin`, `/admin/client/[id]`).
- Plan tier renamed `agency` → `multi_location` (migration `20260511`).
- Slack webhook notifications retired in favor of a single Resend "notify email" to `NOTIFY_EMAIL`.
- **Known drift:** Pro tool components (`app/dashboard/tools/**`) and shared widgets (`app/components/*Widget.tsx`, `UpgradeSlot`, `StatusPill`, etc.) still use heavy inline `style={{}}` in violation of the styling rules in [`AGENTS.md`](../AGENTS.md). The SaaS shell pages (`app/login`, `app/signup`, `app/dashboard`, `app/dashboard/grid`) and the original free-funnel surfaces are clean via CSS Modules.
