# **LSA Free Audit Tool — Build Spec**

**Local Visibility Scan | AI-Powered Local SEO Auditor for Contractors**

> This spec covers the **free, top-of-funnel audit experience**. For the
> authenticated SaaS product (dashboard, Pro tools, billing, GBP OAuth,
> geo-grid), see [`saas.md`](./saas.md).

---

## **1. What This Is**

A free tool at `audit.localsearchally.com` that takes inputs from a
contractor, runs a live AI-powered 8-section local SEO audit using real
pre-fetched data + web search, returns an instant scored report, and captures
their email in exchange for the PDF action plan.

It is the primary lead-generation surface for Local Search Ally. Completing
an audit → email capture → 3-email drip → Calendly. Audits remain shareable
forever via `/audit/[id]`.

---

## **2. Architecture Overview**

```
[Contractor fills form]
   ↓
[React frontend → POST /api/audit (SSE stream)]
   ↓
[Next.js API route: parallel pre-fetch from 6 data sources]
   ↓
[Claude receives pre-fetched block + uses web_search only for citations]
   ↓
[Claude returns full JSON → sections streamed with 150ms stagger]
   ↓
[Final JSON stored in Supabase → unique shareable URL generated]
   ↓
[Email gate → POST /api/email → Resend sends PDF + schedules drip]
   ↓
[Notify email fires to Chad on audit completion and email capture]
   ↓
[3-email drip sequence (day 2, 5, 10) scheduled via Resend → Calendly booking]
```

---

## **3. Tech Stack**

| Layer         | Choice                                                              | Why                                                           |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| Framework     | Next.js 16.2.2 (App Router)                                         | API routes + React in one repo                                |
| React         | React 19                                                            | Current stable                                                |
| Styling       | Tailwind CSS v4 + CSS Modules                                       | Tailwind for layout/spacing, CSS Modules for component styles |
| Animations    | Framer Motion                                                       | Progressive section reveal, form/results transitions          |
| AI            | Anthropic `claude-sonnet-4-20250514`                                | Best balance of speed + quality                               |
| Web Search    | Built-in `web_search_20250305` tool                                 | Citations only (Yelp, BBB, Angi NAP consistency)              |
| Pre-fetch     | Google Places API, PageSpeed, Serper, DataForSEO, direct HTML fetch | Authoritative data before Claude call                         |
| Email         | Resend (scheduled sends)                                            | Immediate delivery + drip scheduling via `scheduledAt`        |
| PDF Report    | `@react-pdf/renderer`                                               | Branded PDF generated server-side in `/api/email`             |
| Hosting       | Vercel                                                              | Zero-config Next.js deploy                                    |
| Database      | Supabase                                                            | Shareable result URLs + 24-hour audit cache                   |
| Rate Limiting | Upstash Redis (sliding window)                                      | 1 audit per IP per 30 days                                    |

---

## **3a. Styling Architecture**

Three-layer system — each layer has a specific job:

| Layer                 | File                        | Used for                                                       |
| --------------------- | --------------------------- | -------------------------------------------------------------- |
| CSS custom properties | `app/globals.css`           | Brand tokens — single source of truth for all colors and fonts |
| CSS Modules           | `styles/audit.module.css`   | Audit tool component styles, animations, pseudo-selectors      |
| CSS Modules           | `styles/landing.module.css` | Landing page component styles                                  |
| Tailwind utilities    | inline `className`          | Layout, spacing, flex/grid, responsive breakpoints             |

**Rules (also in AGENTS.md):**

- Brand token values live only in `app/globals.css` as CSS vars — never hardcode hex values or font names in JSX or module files
- CSS Modules consume tokens via `var(--carolina)`, `var(--font-ui)`, etc.
- Dynamic state (green/yellow/red score colors) driven by `data-status` attribute selectors in the CSS module — not inline styles
- **Inline styles are only acceptable for SVG geometry that requires runtime-calculated numbers** (e.g. `strokeDasharray` on the score gauge). Everything else belongs in CSS Modules or Tailwind.

---

## **4. Input Form**

Four required fields:

```ts
interface AuditInput {
  businessName: string; // "Rogers HVAC Pro"
  websiteUrl: string; // "rogershvacpro.com" — optional; empty = no website
  primaryTrade: string; // "HVAC" (dropdown)
  serviceCity: string; // "Rogers, AR"
}
```

**Trade dropdown:** HVAC · Plumbing · Electrical · Roofing · Landscaping · Remodeling · General Contracting · Other

**Validation:**

- Business name: required, min 2 chars
- URL: optional; if present, `https://` is prepended when missing
- Trade: required, from list
- City: required, min 2 chars

**No-website handling:** If `websiteUrl` is empty, the prefetch pipeline skips
URL-based sources (PageSpeed, on-page, backlinks) and Claude is instructed to
score those sections as 1. There is no longer a separate `noWebsite` toggle —
empty URL is the signal.

**Prefill via query params:** The form reads `?business=`, `?city=`, and
`?trade=` from `useSearchParams` to support deep links from the SaaS dashboard
("Re-run audit" flow).

---

## **5. API Route — `/api/audit`**

**File:** `app/api/audit/route.ts`

**`POST /api/audit`** — Body: `AuditInput` — Returns: SSE stream of `{ event: "section"|"status"|"complete"|"error", data: ... }`

`export const maxDuration = 120;` (Vercel max timeout)

### **Request flow:**

1. Parse and validate JSON body; sanitize all string inputs (HTML strip, length caps, strict URL protocol check)
2. IP rate-limit check (Upstash Redis — 1 per IP per 30 days, fails open on Redis error)
3. **If a session cookie is present**, associate the resulting audit with `user_id` so it appears in their dashboard
4. 24-hour cache check (skip steps 5–6 if same `websiteUrl` audited in last 24h)
5. **Parallel pre-fetch** from 6 sources (see §5a)
6. Call Claude with pre-fetched block + web_search tool (citations only)
7. Stream sections with 150ms stagger via SSE; emit `status` events while waiting
8. Persist to Supabase `audits` table (including GBP snapshot columns + `user_id`)
9. Fire notify email to Chad via Resend (non-blocking)
10. Send SSE `complete` event with `auditId`

### **Error handling:**

| Error                     | Behavior                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON parse fails (Claude) | First strip markdown code fences from the response text; if still unparseable, retry the full Claude call once with `"\n\nReturn ONLY JSON, no other text."` appended |
| Rate limited              | 429 with message: "You've already run a free audit this month."                                                                                                       |
| AbortError (120s timeout) | SSE error: "The audit took too long — try again, it usually completes."                                                                                               |
| Supabase insert fails     | Result still returned to user; error logged silently                                                                                                                  |
| Notify email fails        | Non-blocking catch; error logged                                                                                                                                      |
| Pre-fetch source fails    | Graceful fallback — Claude receives "Could not fetch" message for that block                                                                                          |

### **SSE wire format**

```
event: status
data: {"message":"Reading your Google Business Profile…"}

event: section
data: {"id":"gbp","name":"Google Business Profile","score":6,"status":"yellow","headline":"...","finding":"...","priority_action":"..."}

event: complete
data: {"business_name":"...","overall_score":5,"overall_label":"Needs Work","summary":"...","has_website":true,"score_bucket":"Needs Work","sections":[...],"top_3_actions":[...],"competitor_names":[...],"ai_citability_score":4,"ai_citability_section":{...},"auditId":"uuid","cached":false}

event: error
data: {"message":"The audit took too long — try again, it usually completes."}
```

---

## **5a. Pre-Fetch Pipeline**

**Files:** `lib/prefetch.ts` (barrel), `lib/prefetch/*.ts` (per-source modules)

All 6 sources run in parallel via `Promise.all` before Claude is called.
Pre-fetched data is injected as an authoritative block into the Claude prompt.
Claude must use these values verbatim and may not contradict them.

| Source           | API                                   | Module                          | Env var                 |
| ---------------- | ------------------------------------- | ------------------------------- | ----------------------- |
| GBP              | Google Places API (New) — searchText  | `lib/prefetch/gbp.ts`           | `GOOGLE_PLACES_API_KEY` |
| PageSpeed        | PageSpeed Insights API v5 (mobile)    | `lib/prefetch/website.ts`       | _(no key required)_     |
| Map Pack         | Serper.dev search API                 | `lib/prefetch/serper.ts`        | `SERPER_API_KEY`        |
| On-page / Schema | Direct HTML fetch (250KB cap)         | `lib/prefetch/website.ts`       | _(none)_                |
| Backlinks        | DataForSEO Backlinks Summary Live     | `lib/prefetch/links-reviews.ts` | `DATAFORSEO_API_KEY`    |
| Reviews          | DataForSEO Business Data Reviews Live | `lib/prefetch/links-reviews.ts` | `DATAFORSEO_API_KEY`    |

**AI Citability signals:** A 7th derived block computed from the GBP, on-page,
and reviews blocks via `computeAICitabilitySignals()` in
`lib/prefetch/ai-citability.ts`. No external API call. Feeds the
`ai_citability` audit section (see §8).

**Per-source timeouts:** Each pre-fetch source has its own
`AbortSignal.timeout()` cap so a single slow source never burns the shared
120s budget before Claude starts. Timeouts: GBP 10s · PageSpeed 20s · Serper
10s · website crawl 12s (+ 5s sitemap HEAD) · DataForSEO backlinks 15s ·
DataForSEO reviews 20s. A timeout always returns a graceful fallback block —
it never throws to the outer `Promise.all`.

**No-website handling:** PageSpeed, on-page, and backlinks fetches are skipped
entirely when `websiteUrl` is empty. Claude is told to score `onpage`,
`technical`, and `backlinks` as 1.

**Photo count note:** Google Places API caps the photos array at 10. If 10
are returned, the block is marked "10+ (API maximum returned)" so Claude
doesn't penalize for the cap.

---

## **6. System Prompt**

Claude receives a system prompt that defines scoring rules, pre-fetched data
usage, and the required JSON output format. Key rules enforced by the prompt:

**Section scoring (8 sections):**

1. `gbp` — GBP completeness from GBP_EXISTS block (claimed, photos, hours, phone)
2. `reviews` — Recency and owner response rate from REVIEWS_DATA; total count and rating from GBP block
3. `onpage` — Title, H1, H2s, meta description from ONPAGE_DATA
4. `technical` — Core Web Vitals from PAGESPEED; HTTPS, sitemap, schema from ONPAGE_DATA
5. `citations` — NAP consistency across Yelp, BBB, Angi, HomeAdvisor (web search only)
6. `backlinks` — Domain rank, referring domains from BACKLINKS block; rank < 20 = red, 20–39 = yellow, 40+ = green
7. `competitors` — MAP_PACK block (real Serper results); compare this business against those competitors
8. `ai_citability` — Derived from `AI_CITABILITY_SIGNALS` block. Sub-signals: `grounding`, `review_density`, `photo_freshness`, `schema_markup` (each `strong | partial | weak | unknown`)

The section label map is the single source of truth in
[`lib/types.ts`](../lib/types.ts) → `SECTION_LABELS`. Add new sections there,
nowhere else.

**Data source rules:**

- Pre-fetched blocks are authoritative — Claude may not contradict them
- `GBP_EXISTS: NO` → `gbp` section scores red regardless of web search
- Web search is permitted **only** for citations
- All other sections use pre-fetched data exclusively

**Scoring bands:**

- 8–10 → `status: "green"`
- 5–7 → `status: "yellow"`
- 1–4 → `status: "red"`

**Summary framing by score bucket:**

- 1–3 (Critical): "[Business] is effectively invisible to local search — [primary gap] is the main reason customers can't find them."
- 4–6 (Needs Work): "[Business] shows up occasionally but lacks the signals to stay visible — [primary gap] is the biggest leak."
- 7–9 (Solid): "[Business] is in the fight for Map Pack visibility, but [primary gap] is letting competitors steal leads."
- 10 (Strong): "No critical gaps found."

**Voice:** Plain English. Every finding names a business consequence (lost calls, lost jobs, invisible on Google). Never invent data.

---

## **7. User Prompt Builder**

`buildAuditPrompt(input, prefetch)` constructs the user message with:

1. Business name, website (or "NONE"), trade, city
2. No-website note if applicable
3. Full PRE-FETCHED DATA block from all 6 sources + AI citability signals:
   `GBP_EXISTS` · `PAGESPEED` · `ONPAGE_DATA` · `BACKLINKS` · `REVIEWS_DATA` · `MAP_PACK` · `AI_CITABILITY_SIGNALS`

Claude is instructed to use pre-fetched data for all sections and web search
only for citations.

**JSON parse retry:** If Claude's response fails `JSON.parse`, the prompt is
retried once with `"\n\nReturn ONLY JSON, no other text."` appended.

---

## **8. Response Schema (TypeScript)**

Single source of truth: [`lib/types.ts`](../lib/types.ts). Highlights:

```ts
export interface AuditSection {
  id: string;
  name: string;
  score: number;
  status: "green" | "yellow" | "red";
  headline: string;
  finding: string;
  priority_action: string;
  sub_signals?: {
    // only on ai_citability
    grounding: "strong" | "partial" | "weak";
    review_density: "strong" | "partial" | "weak";
    photo_freshness: "strong" | "weak" | "unknown";
    schema_markup: "strong" | "partial" | "weak";
  };
}

export interface AuditResult {
  business_name: string;
  overall_score: number;
  overall_label: "Strong" | "Solid" | "Needs Work" | "Critical";
  summary: string;
  has_website: boolean;
  score_bucket: "Critical" | "Needs Work" | "Solid" | "Strong";
  sections: AuditSection[];
  top_3_actions: string[];
  competitor_names: string[];
  ai_citability_score?: number; // mirrored from the ai_citability section
  ai_citability_section?: AICitabilitySection;
  auditId?: string; // set by API after Supabase insert
  cached?: boolean;
}
```

**UI score display labels** (mapped from `overall_label` in `AuditTool.tsx`):

| API value  | Displayed as      |
| ---------- | ----------------- |
| Critical   | Digital Ghost     |
| Needs Work | Local Mirage      |
| Solid      | Visible Contender |
| Strong     | Local Authority   |

**`overall_label` vs `score_bucket`:** Identical values. `score_bucket` is the
DB column used for indexed filtering; `overall_label` is for display.

---

## **9. Shareable Result URLs**

Every completed audit gets a unique URL. Permanent, shareable, no login needed.

**Database:** Supabase table `audits` (see [`saas.md` §6](./saas.md) for the
full schema including the `user_id` column added for dashboard ownership).

**URL pattern:** `audit.localsearchally.com/audit/[uuid]`

**Shared audit page:** `app/audit/[id]/page.tsx` — server component that
fetches the audit row and passes it to `SharedAuditView`. Generates dynamic
Open Graph metadata (`[Business Name] — Local SEO Audit | Local Search Ally`).
Returns `notFound()` if the UUID doesn't exist.

`SharedAuditView` renders the full audit result — all 8 sections fully
unlocked with no email gate — plus a "Copy Link" button and a CTA to run their
own audit.

**Cache logic:** Before calling Claude, check for a matching `websiteUrl` row
within the last 24 hours. If found, stream the cached sections with 150ms
stagger and return `cached: true` on the complete event.

---

## **10. Lead Notifications to Chad**

A single **notify email** fires at two points via Resend:

1. **Audit completion** (`/api/audit` — non-blocking, fires after Supabase insert): business name, trade, city, score, score bucket, link to audit. Test/spam submissions (matching `test|asdf|foo|bar|...` etc.) are filtered out.
2. **Email capture** (`/api/email` — non-blocking): same payload + the captured email address.

Sent to `process.env.NOTIFY_EMAIL`. If unset, the call is silently skipped.

> Slack webhook notifications were removed — `SLACK_WEBHOOK_URL` is no longer
> read by the codebase. Notifications go through Resend.

---

## **11. Frontend UX Flow**

**Component:** `app/components/AuditTool.tsx` (client component)
**Sub-components:** `app/components/audit/AuditForm.tsx`, `AuditLoading.tsx`, `AuditResults.tsx`
**Animations:** Framer Motion (`motion`, `AnimatePresence`)

### **Phase: form**

- 4 fields (no checkbox — empty URL = no website)
- Validation runs on submit; inline field-level error messages
- CTA: "Run My Free Audit →"
- `auditError` shown as a banner above the form on retry
- Prefill from `?business`, `?city`, `?trade` query params

### **Phase: loading**

- 8 section chips with status: queued → pulsing dot (active) → green checkmark (done)
- Driven by `doneSections` array and `activeSectionId` state updated as SSE sections arrive
- `statusMessage` updates from `status` SSE events ("Connecting…" → "Reading your GBP…" → "Scoring your results…")
- No fake progress bar — mirrors the real pipeline

### **Phase: results**

Results shown immediately after SSE `complete` event (no gate on the on-page result):

- Overall score gauge (SVG, animated stroke — inline style only for `strokeDasharray`)
- Score display label (Digital Ghost / Local Mirage / Visible Contender / Local Authority)
- Business name + one-sentence summary
- Competitors found
- Top 3 priority actions
- All 8 section cards (score, status dot, headline, finding, priority action)
- Share Results button (copies `/audit/[auditId]` to clipboard)

**Email gate:** Below results, a sticky email capture form. On submit, POSTs
to `/api/email` which triggers PDF generation and drip sequence.

**Post-email:** "Report sent" confirmation + Calendly book-a-call CTA.

---

## **12. Email Route — `/api/email`**

**File:** `app/api/email/route.ts`

**`POST /api/email`** — Body: `EmailPayload`

```ts
type EmailPayload = {
  email: string;
  auditId: string | null;
  businessName: string;
  trade: string;
  city: string;
  scoreBucket: string;
  overallScore: number;
  lowestSection: string; // section ID of lowest-scored section
};
```

### **Request flow:**

1. Validate email format (regex gate)
2. Fetch audit row from Supabase using `auditId`
3. Generate PDF via `@react-pdf/renderer` → `renderToBuffer(createElement(AuditPdf, props))`
4. Send immediate email via Resend with PDF attached (`audits@localsearchally.com`)
5. Add contact to Resend audience (non-blocking, uses `RESEND_AUDIENCE_ID`)
6. Schedule 3 drip emails via Resend `scheduledAt` (non-blocking):
   - **Day 2:** "One thing to fix first — [Business Name]" — focuses on `lowestSection`
   - **Day 5:** "What [trade] contractors in the Map Pack do differently"
   - **Day 10:** "Last note from Local Search Ally"
7. Fire notify email to Chad with the captured address + audit link (non-blocking)
8. Return `{ ok: true }`

**PDF generation failure:** Non-fatal. Email is sent without attachment if
`renderToBuffer` throws.

**CAN-SPAM compliance:** Every email (immediate + 3 drips) includes an
unsubscribe link (Resend's hosted unsubscribe) and the physical mailing
address `707 West Jillian Street, Siloam Springs AR 72761` in the footer.

---

## **13. PDF Report**

**File:** `lib/AuditPdf.tsx`
**Library:** `@react-pdf/renderer` — server-side only (called in `/api/email`)
**Props:** `{ result: AuditResult, trade: string, city: string, calendlyUrl?: string }`

Brand tokens are hardcoded constants in `AuditPdf.tsx` (CSS vars cannot be
used in react-pdf): `INK` `#020203` · `CAROLINA` `#7bafd4` · `WHITE` `#ffffff`
· `GRAY` `#9ca3af`.

**Structure:**

- **Page 1 — Cover:** Brand name, "Local SEO Audit Report", business name, trade, city, date
- **Page 2 — Overall Score:** Numeric score, `overall_label`, one-sentence summary, top 3 actions
- **Pages 3–4 — Section Breakdown:** Each of the 8 sections: score, status color dot, headline, finding, priority action
- **Page 5 — CTA:** "Ready to fix this?" + Calendly URL

---

## **14. Environment Variables**

```
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_AUDIENCE_ID=...                     # Resend audience for contact tagging
NOTIFY_EMAIL=chad@...                       # Lead-notification recipient
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=eyJ...
UPSTASH_REDIS_REST_URL=...                 # Used by Redis.fromEnv()
UPSTASH_REDIS_REST_TOKEN=...               # Used by Redis.fromEnv()
NEXT_PUBLIC_SITE_URL=https://localsearchally.com
CALENDLY_URL=https://calendly.com/...       # NEXT_PUBLIC_CALENDLY_URL also accepted
GOOGLE_PLACES_API_KEY=...                  # Places API (New) — GBP lookup
SERPER_API_KEY=...                         # Serper.dev — Map Pack results
DATAFORSEO_API_KEY=...                     # Base64 login:password — backlinks + reviews
```

`SUPABASE_URL` is accepted as a fallback for `NEXT_PUBLIC_SUPABASE_URL`.

---

## **15. Rate Limiting & Cost Control**

**Rate limit:** 1 audit per IP per 30 days — Upstash Redis sliding window via
`@upstash/ratelimit` (`lib/ratelimit.ts`). Redis errors fail open (audit
proceeds) — logged but never shown to user.

**Cost per audit (estimated):**

- Claude tokens: ~$0.05
- DataForSEO Backlinks Summary Live: ~$0.01
- DataForSEO Business Data Reviews Live: ~$0.01
- Serper: ~$0.01
- Google Places API: ~$0.01
- PageSpeed Insights: free
- Direct HTML fetch: free
- **Total: ~$0.09–0.12**

Cache hit: $0.00 (returns Supabase row, skips Claude and all pre-fetch calls).

---

## **16. Security**

### **Input sanitization**

All user-provided strings are sanitized at the API route boundary via
`sanitizeString` / `sanitizeUrl` in `lib/audit-helpers.ts`:

- Strip HTML tags and control characters
- Server-side length caps: `businessName` ≤ 100, `websiteUrl` ≤ 300, `serviceCity` ≤ 100
- URL parsed with `new URL()`; only `http:` / `https:` protocols accepted

### **Prompt injection defense**

The system prompt explicitly instructs Claude that input field values are
user-supplied data, not instructions. Mitigates attacks where a business name
contains `"Ignore all previous instructions…"`.

### **Service key isolation**

The Supabase service role key bypasses RLS. It must never appear in
client-side code. All Supabase operations go through server-side API routes
or server components.

---

## **17. Current State (May 2026)**

- Free audit funnel is live in production at `localsearchally.com` (home page renders `HeroSection` → `AuditTool`).
- 8 audit sections (the original 7 + `ai_citability`, derived signals only — no extra API call).
- `noWebsite` boolean has been removed — empty `websiteUrl` is the signal.
- Slack notifications were replaced with a single Resend "notify email" sent to `NOTIFY_EMAIL`.
- The `/free-local-seo-audit` SEO landing page was retired — the home route is now the canonical surface and carries the SEO metadata directly via `app/layout.tsx`.
- Authenticated users have their audits associated to their account on creation and listed in the dashboard.
- See [`saas.md`](./saas.md) for everything that wraps around this funnel (auth, billing, dashboard, tools, GBP OAuth, geo-grid).
