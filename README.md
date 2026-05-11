# LSA Audit Tool

AI-powered local SEO auditor for NWA contractors. Built for **Local Search Ally**.

Visitors enter a business name, trade, and city → the tool fetches Google Business Profile, citation, review, competitor, backlink, on-page, technical, and AI-visibility signals, then ships back a scored audit with prescriptive fixes. Logged-in customers on a Pro plan get persistent dashboards, a geo-grid rank tracker, GBP automation, and eight deeper Pro tools.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict)
- **Supabase** (Postgres + Auth, RLS-scoped audits, grid scans, GBP connections, subscriptions)
- **Anthropic Claude** for scoring + narrative analysis
- **DataForSEO Maps + Serper** for SERP, citation, and rank data
- **PayPal Subscriptions** for trial → paid billing (Pro $49/mo, Multi-Location $199/mo)
- **Resend** for transactional notification email
- **Vercel** for hosting + cron

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Required env vars are documented in [`docs/audit-tool.md`](docs/audit-tool.md) and [`docs/saas.md`](docs/saas.md).

## Project layout

- `app/` — App Router routes, API handlers, and page components
- `app/api/` — All HTTP endpoints (audit, tools, GBP OAuth, PayPal, cron, grid)
- `app/components/` — Shared UI (widgets, nav, footer, audit shell)
- `lib/` — Domain logic (Claude prompts, prefetch, GBP, PayPal, Supabase clients, types)
- `lib/prefetch/` — Parallel data fetchers used by `/api/audit`
- `lib/tools/` — Pro-tool helpers (citation directories, GBP optimizer)
- `styles/` — CSS Modules; brand tokens live in `app/globals.css`
- `supabase/migrations/` — Source of truth for schema
- `docs/` — Architecture + spec docs

## Documentation

- [`AGENTS.md`](AGENTS.md) — Rules for AI coding assistants working in this repo
- [`docs/audit-tool.md`](docs/audit-tool.md) — Free audit funnel: data flow, API contracts, scoring
- [`docs/saas.md`](docs/saas.md) — Pro SaaS layer: auth, billing, dashboard, tools, geo-grid

## Scripts

```bash
npm run dev          # next dev with Turbopack
npm run build        # next build
npm run start        # next start
npm run lint         # eslint
npx tsc --noEmit     # type check
```

## Conventions

- App Router only — never use the Pages Router
- All API routes live under `app/api/`
- Layout/spacing in Tailwind; visual styles in CSS Modules; brand tokens via `var(--token)` in [`app/globals.css`](app/globals.css)
- Never hardcode hex values or font names — consume tokens
- Inline `style={{}}` is only allowed for runtime-calculated SVG geometry

See [`AGENTS.md`](AGENTS.md) for the full ruleset.
