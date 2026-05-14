# Local Search Ally — Full Project Overview

**Last updated:** May 13, 2026  
**Owner:** Chad Smith, Local Search Ally — Siloam Springs, AR  
**Phone:** (479) 380-8626 | **Email:** smithchadlamont@gmail.com

This document consolidates both LSA properties into a single reference.
Read it any time you need to get re-oriented on what exists, how things connect,
and what the vision is — before building anything new.

---

## The Two-Property Ecosystem

```
localsearchally.com          ←  marketing site, conversion, blog
audit.localsearchally.com    ←  free audit tool + paid client dashboard
```

Both share the same brand, the same design tokens, and a cross-domain
GA4 setup (linker configured for both domains). They are separate Next.js
codebases deployed independently on Vercel. The marketing site links to the
audit tool as its primary CTA; the audit tool links back to the marketing
site for context and booking.

---

## Property 1 — Marketing Site

**Repo:** `/Users/chadsmith/local-search-ally`  
**Live URL:** https://www.localsearchally.com  
**Deployment:** Vercel, `main` branch = production

### Purpose

The marketing site's one job: turn an invisible contractor into a booked
strategy call. Every page frames the problem as invisibility on Google —
the villain is never "bad marketing," always being invisible. Chad is the
guide; the trade owner is the hero.

**Primary CTA throughout the site:** Run the free SEO audit at audit.localsearchally.com

### Tech Stack

| Layer       | Choice                                                       |
|-------------|--------------------------------------------------------------|
| Framework   | Next.js (App Router) — JavaScript only, no TypeScript        |
| Styling     | CSS Modules for all layout + Tailwind v4 for color/type/states |
| Blog        | MDX — posts in `src/posts/`                                  |
| 3D / WebGL  | React Three Fiber + `@react-three/drei`                      |
| Animations  | Framer Motion                                                |
| Fonts       | `next/font` — Bricolage Grotesque, Space Grotesk, JetBrains Mono |
| Analytics   | GA4 (G-SGQ98MEHWZ), cross-domain linked with audit tool      |
| Deployment  | Vercel                                                       |

**Critical Tailwind v4 note:** Layout utilities (`flex`, `grid`, `gap`, `p-6`,
`mx-auto`, `h-full`) do not generate reliably for client components. Put ALL
layout in CSS Modules. Tailwind handles only color, typography, hover/focus
states, transitions, and shadows.

### Site Map

| Page              | Path                          | Purpose                               |
|-------------------|-------------------------------|---------------------------------------|
| Homepage          | `/`                           | Primary conversion page               |
| Services          | `/services`                   | Service breakdown with starting prices |
| Citation Building | `/services/citation-building` | Dedicated citation service page       |
| Service Areas     | `/service-areas`              | NWA city landing pages                |
| Portfolio         | `/portfolio`                  | Demo sites and build quality proof    |
| Resources         | `/resources`                  | Downloads and guides hub              |
| Blog              | `/blog`                       | Educational content, no gate          |
| About             | `/about`                      | Chad's story, values, pledge          |
| Contact           | `/contact`                    | Strategy call booking via Calendly    |
| GBP Checklist     | `/gbp-checklist`              | Free checklist download               |
| Privacy           | `/privacy`                    | Privacy policy                        |
| Terms             | `/terms`                      | Terms of service                      |

### Homepage Section Order

1. **HeroSection** — headline, subhead, primary CTA
2. **ProblemSection** — frames invisibility as the villain
3. **ServicesSection** — what's offered at a glance
4. **StatsSection** — third-party data (approved sources only)
5. **ICPSection** — mirror for the ideal customer
6. **ProcessSection** — Audit → Fix Priority Gaps → Grow and Track
7. **TestimonialsSection** — Harmonie Grace Foundation review + workshop proof
8. **FinalCTASection** — last conversion push

### API Routes

| Route                              | Purpose                                  |
|------------------------------------|------------------------------------------|
| `/api/contact`                     | Contact form handler                     |
| `/api/subscribe`                   | Email list signup                        |
| `/api/indexnow`                    | IndexNow ping on content updates         |
| `/api/cron/email-sequence`         | Scheduled email drip for subscribers     |

### SEO Infrastructure

- Every page exports `generateMetadata()` with title, description, OG tags
- Homepage: `LocalBusiness`, `Person`, and `FAQPage` JSON-LD schemas (19 FAQs)
- Root layout: `WebSite` and `ProfessionalService` JSON-LD
- Blog posts: `Article` JSON-LD from MDX frontmatter
- `robots.js`, `sitemap.js`, `manifest.json` are live and correct — do not rewrite
- `llms.txt` route — AI crawler optimization
- All images use `next/image` with descriptive alt text
- One `<h1>` per page, logical heading hierarchy always

### Services & Pricing (current live prices)

| Service                  | Starting Price | Notes                                    |
|--------------------------|----------------|------------------------------------------|
| Local SEO                | $499/mo        | GBP, citations, on-page, monthly reports |
| GBP Optimization         | $199           | Full profile audit, photo strategy       |
| Web Design & Development | $799           | Mobile-first, SEO-built                  |
| Reputation Building      | $99/mo         | Review systems, templates, monitoring    |
| Content & Keywords       | $299/mo        | Service pages, location pages, blog      |
| SEO Audits               | $299           | Technical, citation audit, competitor gap |
| Citation Building        | See sub-page   | `/services/citation-building`            |

Month-to-month. No contracts. No setup fees.

### Brand Voice Rules (always enforce)

- "I" — never "we"
- Lead with the problem, not the service
- The contractor is the hero, Chad is the guide
- No banned words: solutions, leverage, synergy, cutting-edge, dominate,
  moves the needle, complete solution, powered by, best-in-class, transform,
  digital/online presence, drive traffic, strategic content
- Approved CTAs only: "Let's Talk — It's Free," "See Where You Stand Online,"
  "Run Your Free SEO Audit," "Book your strategy call →"

### Design Tokens (shared with audit tool)

```
--carolina:    #7bafd4   primary accent, CTAs, links, borders
--slate:       #1a222e   depth — badges, dark feature blocks
--steel:       #3a5570   secondary accent, hover states
--bg:          #0a0a0a   page background
--surface:     #141414   cards, nav, elevated sections
--surface2:    #1e1e1e   secondary surface
--text:        #f8f9fa   all primary text
--muted:       #6c757d   captions, labels
--border:      rgba(255,255,255,0.06)
--border-strong: rgba(255,255,255,0.12)
--green:       #00ff88  (status/data only)
--yellow:      #ffcc00  (status/data only)
--red:         #ff4d4d  (status/data only)
```

### Fonts

- **Bricolage Grotesque** — display/headings, weight 700, −0.02em tracking
- **Space Grotesk** — body/UI, weight 400, 1.7 line-height
- **JetBrains Mono** — data, metrics, tool UIs only — never in marketing copy

### Code Conventions

- Server Components by default; `"use client"` only for event handlers, hooks, Framer Motion, R3F
- All layout in `.module.css` colocated with the component
- Components: PascalCase `.jsx` + matching `.module.css`
- Utilities: camelCase `.js`
- R3F canvases: `next/dynamic` + `ssr: false` + `Suspense` fallback + `pointerEvents: none`
- Phone numbers always `<a href="tel:+14793808626">` — critical on mobile
- Keep components under ~150 lines; split if larger

### What Not to Touch

- `src/posts/` — all MDX blog content
- `src/app/api/` — API routes
- `globals.css` — design tokens and shared layout classes
- `layout.js` — root layout
- `robots.js`, `sitemap.js`, `manifest.json`

---

## Property 2 — LSA Audit Tool

**Repo:** `/Users/chadsmith/lsa-audit-tool`  
**Live URL:** https://audit.localsearchally.com  
**Deployment:** Vercel  
**Language:** TypeScript throughout

### Purpose

The audit tool replaces the cold "book a call" CTA. A contractor enters their
business info, gets a real AI-powered 7-section local SEO audit in 60–90
seconds, and sees exactly where they stand. This is the primary lead generation
mechanism for the entire business.

The tool also serves as a SaaS product: after running a free audit, users can
sign up for a paid plan that unlocks a persistent dashboard, connected tools,
GBP integration, and ongoing monitoring.

### Tech Stack

| Layer           | Choice                                          |
|-----------------|-------------------------------------------------|
| Framework       | Next.js (App Router) — TypeScript               |
| Styling         | Tailwind + CSS Modules (`styles/*.module.css`)  |
| AI              | Anthropic Claude (Sonnet) via `ANTHROPIC_API_KEY` |
| Database        | Supabase (audits, profiles, subscriptions, grid_scans) |
| Auth            | Supabase Auth (magic link / email)              |
| Rate Limiting   | Upstash Redis                                   |
| Email           | Resend — notifications + lead nurture           |
| Billing         | PayPal (trial + subscription)                   |
| GBP Integration | Google Business Profile OAuth                  |
| Deployment      | Vercel (120s max function duration)             |

### How the Free Audit Works

1. Contractor fills in 4 fields: Business Name, Website URL, Primary Trade, Service City
2. POST to `/api/audit` — rate limited per user ID (preferred) or IP
3. Parallel pre-fetch: GBP data, PageSpeed, SERP results (Serper), website scrape, backlinks, reviews — all fetched simultaneously; failures degrade gracefully per section
4. Claude analyzes all prefetched data and scores 7+1 sections
5. Results stream back via SSE with 150ms stagger between sections
6. Audit saved to Supabase `audits` table → shareable UUID URL (`/audit/[id]`)
7. 24-hour cache: same URL + business name within 24 hours returns cached result instantly
8. Email notification fires to Chad immediately (filtered for obvious test submissions)
9. Spam filter: skips notification for test/dummy business names

**Audit Sections (each scored 1–10, red/yellow/green):**

| Section         | What It Checks                                                    |
|-----------------|-------------------------------------------------------------------|
| GBP             | Claimed, complete, keyword-optimized, photo count, active posts   |
| Reviews         | Quantity, recency, average rating, owner response rate            |
| On-Page         | Title tags, H1s, dedicated service pages, keyword targeting       |
| Technical       | Core Web Vitals, HTTPS, sitemap, schema markup (LocalBusiness JSON-LD) |
| Citations       | NAP consistency across Google, Yelp, BBB, Angi, HomeAdvisor       |
| Backlinks       | Domain authority signals, local/industry links, anchor text       |
| Competitors     | Top 3 Map Pack for [trade] [city] AR — comparison                 |
| AI Citability   | Signals for ChatGPT/Perplexity visibility (bonus section)         |

**No-website handling:** If contractor has no website, on-page/technical/backlinks auto-score to 1, with a
direct message: "No website found — this is costing you calls every day."

**Score buckets:** Critical (1–4) · Needs Work (5–6) · Solid (7–8) · Strong (9–10)

### Authenticated Dashboard

After signing up (invite-only), users get a persistent dashboard at `/dashboard`.

**Dashboard widgets (one per audit section):**

| Widget               | Route                          | What It Does                              |
|----------------------|--------------------------------|-------------------------------------------|
| GBP Widget           | `/dashboard/tools/gbp`         | GBP profile status, fix list, OAuth connect |
| Citations Widget     | `/dashboard/tools/citations`   | NAP consistency check, citation builder   |
| Reviews Widget       | `/dashboard/tools/reviews`     | Review toolkit, request templates         |
| Competitors Widget   | `/dashboard/tools/competitors` | Competitor watch, Map Pack tracking       |
| Backlinks Widget     | `/dashboard/tools/backlinks`   | Backlink analysis, outreach suggestions   |
| On-Page Widget       | `/dashboard/tools/onpage`      | On-page fixer, title/H1 analysis          |
| Technical Widget     | `/dashboard/tools/technical`   | CWV monitor, schema checker               |
| AI Citability Widget | `/dashboard/tools/ai-citability` | ChatGPT/Perplexity visibility signals    |

**Geo-Grid rank tracking:** `/dashboard/grid` — generates a geographic grid around the
business and tracks Map Pack rank at each grid point (stored in `grid_scans` table).

**GBP OAuth integration:** Connects directly to the business's Google Business Profile.
Enables: listing location selection, description rewrite (AI-generated), weekly post
scheduling, review monitoring.

### Subscription & Billing

| Plan           | Monthly | Annual (billed yearly) | Notes                              |
|----------------|---------|------------------------|------------------------------------|
| Free           | $0      | $0                     | Audits + score only; all tools locked |
| Pro            | $49/mo  | $36/mo ($432/yr)       | All 8 tools, geo-grid, unlimited audits; 14-day free trial |
| Multi-Location | $199/mo | $149/mo ($1,788/yr)    | Everything in Pro, up to 10 locations, white-label PDFs, priority support + 1:1 onboarding |

- Annual Pro is an early-adopter price locked for life as long as the subscription stays active
- PayPal handles billing: trial authorization, subscription activation, webhook reconciliation
- 14-day free trial requires PayPal authorization upfront; no charge until day 15
- Invite-only signup: `/api/auth/check-invite` validates email against `invited_emails` table
- Free-tier users are auto-invited via the `save-audit` flow (no manual invite needed)
- Plan check: `getUserPlan()` / `hasProAccess()` gate dashboard tools

### Admin Portal

`/admin` — accessible only to users with `is_admin = true` in the `profiles` table.

Shows all clients, their business names, last audit date, and latest overall score
with color-coded indicators (green ≥7, yellow ≥4, red <4). Each client row links
to `/admin/client/[id]` for a full view of that client's dashboard.

### Lead Notification Flow

Every real audit submission:
1. Supabase insert → `audits` table (business_name, score, trade, city, full result, GBP raw fields)
2. Resend email → Chad's inbox: business name, trade, city, score/bucket, "View Full Audit →" link
3. Spam filter prevents notifications for test/dummy submissions (regex on business name)

### Key API Routes

| Route                           | Purpose                                         |
|---------------------------------|-------------------------------------------------|
| `/api/audit`                    | Core audit endpoint — POST, SSE stream response |
| `/api/email`                    | Email capture, PDF delivery, 6-drip enrollment  |
| `/api/gbp/oauth/start`          | GBP OAuth flow initiation                       |
| `/api/gbp/oauth/callback`       | GBP OAuth callback handler                      |
| `/api/gbp/locations`            | Fetch connected GBP locations                   |
| `/api/gbp/post`                 | Create GBP post                                 |
| `/api/gbp/update-description`   | Rewrite GBP description via Claude              |
| `/api/grid`                     | Geo-grid rank scan                              |
| `/api/paypal/start-trial`       | Initialize PayPal trial subscription            |
| `/api/paypal/webhook`           | PayPal webhook handler                          |
| `/api/paypal/return`            | PayPal return URL handler                       |
| `/api/cron/reconcile-paypal`    | Cron job to reconcile subscription states       |
| `/api/auth/check-invite`        | Validate email against invite list              |
| `/api/auth/save-audit`          | Associate anonymous audit with new account; also enrolls email in drip sequence so unconverted magic-link recipients still get follow-up |
| `/api/tools/*`                  | Tool-specific endpoints (8 tools × fetch/action) |

### Supabase Tables (known)

| Table             | Purpose                                               |
|-------------------|-------------------------------------------------------|
| `audits`          | All audit results — anonymous and user-linked         |
| `profiles`        | User profiles — email, business_name, is_admin flag   |
| `grid_scans`      | Geo-grid rank tracking sessions                       |
| `invited_emails`  | Invite whitelist for signup gating                    |
| `scheduled_drips` | Tracks Resend email IDs for queued drip emails so they can be cancelled (`resend.emails.cancel()`) when a lead converts. Rows written by `/api/email` and `/api/auth/save-audit`; cancelled by `lib/cancel-drips.ts` on conversion. |

Audit rows include: `business_name`, `overall_score`, `score_bucket`, `trade`, `city`,
`result` (full JSONB), `input` (JSONB), `user_id`, `gbp_rating`, `gbp_review_count`,
`gbp_photo_count`, `gbp_has_hours`, `gbp_found`, `ai_citability_score`, `ai_citability_section`.

### Environment Variables

```
ANTHROPIC_API_KEY
RESEND_API_KEY
NOTIFY_EMAIL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_SITE_URL
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
GOOGLE_CLIENT_ID (GBP OAuth)
GOOGLE_CLIENT_SECRET (GBP OAuth)
```

### Code Conventions (audit tool)

- TypeScript throughout — types in `lib/types.ts`
- Brand tokens imported from CSS custom properties in `app/globals.css` — consume via `var(--carolina)` etc.
- Tailwind for layout + spacing, CSS Modules (`styles/*.module.css`) for component-specific visual styles
- All API routes in `app/api/`
- App Router only — no Pages Router

---

## How the Two Properties Connect

```
Marketing site (localsearchally.com)
  ↓ primary CTA: "Run Your Free SEO Audit" → audit.localsearchally.com
  ↓ "Try tools free →" → audit.localsearchally.com/get-started
Audit tool (audit.localsearchally.com)
  /get-started   — explains the 8 tools, 3-step workflow, and Free vs Pro
                   before asking for anything; buffer for cold marketing traffic
  /              — audit form; free, no email gate, results in 90 seconds
  ↓ free audit completed
  ↓ Chad notified by email immediately
  ↓ lead captured → shareable audit URL
  ↓ email entered → magic link + drip sequence enrolled
  ↓ magic link clicked → account created, pending drips cancelled
  ↓ signup → Pro dashboard
  ↓ "Book a strategy call" → Calendly → marketing site contact
```

**GA4 cross-domain tracking** is live — the root layout on the marketing site
configures GA4 with `linker: { domains: ['localsearchally.com', 'audit.localsearchally.com'] }`
so session attribution flows between properties.

**Shared brand identity:** Both properties use identical design tokens (same hex values,
same font families, same spacing scale). The audit tool's globals.css mirrors the
marketing site's color system. Anyone moving between the two should feel like they
never left.

---

## Note: A Third Related Repo

`/Users/chadsmith/local-search-audit-tool` — This is an earlier, simpler prototype
of the audit tool. It has a single `AuditTool.tsx` component and a `docs/build-spec.md`
that served as the original build specification for the full tool. The `lsa-audit-tool`
repo is the current canonical version — it supersedes this prototype. The build spec
in that repo remains useful historical context for understanding the intended architecture.

---

## The Vision in One Paragraph

Local Search Ally exists to make the best contractor in NWA the most visible one.
The marketing site earns trust and creates the first touch. The audit tool is
the first value delivery — a real, specific answer to "where do I actually stand?"
before anyone spends a dollar. The dashboard converts audit users into paying
clients who get ongoing tools, not just a one-time report. The whole system is
designed around diagnostic honesty: show contractors exactly what's wrong, give
them a clear next step, and let the results do the selling.
