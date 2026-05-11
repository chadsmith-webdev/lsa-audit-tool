# Handoff: Aligning localsearchally.com with the Audit Tool

**For:** Whoever maintains the marketing site (localsearchally.com)
**From:** lsa-audit-tool repo (audit.localsearchally.com)
**Date:** May 2026
**Goal:** Bring the homepage into structural, visual, and offer alignment with the audit SaaS so the funnel feels like one product, not two.

---

## TL;DR

The marketing site already does the hard part right — niche is locked (NWA home service contractors), the free audit is the primary CTA, and the voice is consistent. What's broken is the **handoff between the two domains**:

1. **Pricing mismatch.** Main site says "starting at $497/month." Audit tool sells $49/mo (Pro) and $199/mo (Multi-Location). A visitor who clicks "Run Your Free Audit" then lands on a property selling something different.
2. **No DIY ladder.** Price-sensitive contractors bounce because the only option presented on the main site is $497/mo done-for-you.
3. **Visual drift risk.** Both properties need to consume the same brand tokens; today they're maintained separately.
4. **No round-trip CTA.** The audit tool's upgrade screens push toward $49 SaaS, never back to "have Chad do this for me."

This doc lists the exact homepage changes needed. Implementation lives on the marketing site repo, not this one.

---

## 1. Pricing ladder (highest-priority change)

**Current state on localsearchally.com:**

> "Starting at $497/month · No setup fees · No contracts"

**Recommended state:** Three-tier ladder visible on the homepage and `/services`:

| Tier               | Price   | Who it's for                                       | CTA                                                                |
| ------------------ | ------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| **DIY tools**      | $49/mo  | Owner-operator who wants to do the work themselves | "Start free trial" → `audit.localsearchally.com/signup`            |
| **Multi-Location** | $199/mo | Operators with 2–10 locations or small agencies    | "Start free trial" → `audit.localsearchally.com/signup?plan=multi` |
| **Done-for-you**   | $497/mo | Contractor who wants Chad to run it                | "Book a call" → `/contact`                                         |

**Why:** Gives every visitor a next step that matches their budget. Removes the "$497 or nothing" wall. Lets the SaaS feed the agency tier (DIY user upgrades to done-for-you once they realize it's work).

**Copy guidance for the DIY tier:**

- Lead with what it includes: geo-grid rank tracking, GBP automation, citation tracking, AI visibility checks, 8 Pro tools.
- Be explicit it's self-serve: "You run it. We built the tools we use on our own clients."

---

## 2. Hero section — keep, but tighten the seam

The current hero works. Keep:

- "Local SEO for NWA Home Service Contractors"
- "The audit tells you in 90 seconds"
- Primary CTA: "Run Your Free Audit →"

**Add a secondary CTA below the primary:**

> "Already know you need help? → Book a 30-minute call"

This recovers visitors who are past the audit stage.

**Fix:** Heading rendering bug — "Map Pack invisibility isn't a ranking problem.It's a revenue problem." Missing space after the period.

---

## 3. Visual / brand parity

The audit tool's brand tokens live in [`app/globals.css`](../app/globals.css). The marketing site should consume the **same values** for:

- `--carolina` (primary accent)
- `--font-ui`, `--font-display`
- Background, ink, border tokens
- Score-badge color scale (used on shared audit reports)

**Action:** Export the token block from `app/globals.css` into a shared CSS file (e.g. `brand-tokens.css`) hosted on the marketing site, or copy verbatim into the marketing site's global stylesheet. Never hardcode hex.

**Logo + favicon:** Single source — copy from `public/` in this repo.

**OG image:** The marketing site and audit pages should share an OG template. Reuse the audit tool's OG generator if one exists, or create a shared static OG.

---

## 4. Audit handoff (the seam between domains)

When a visitor clicks "Run Your Free Audit" on localsearchally.com:

**Today:** Lands on `audit.localsearchally.com` cold form.
**Better:** Pre-fill what we can. If the visitor came from a trade or city page, pass query params:

```
audit.localsearchally.com?trade=hvac&city=rogers
```

The audit tool's `AuditTool` component already accepts business name, trade, and city — wire query-param prefill.

**After the audit completes**, the report screen should show **two** upgrade paths, not one:

1. "Track this monthly + use Pro tools → $49/mo" (existing)
2. "Have Chad fix this for you → Book a call" (new — links back to `localsearchally.com/contact`)

This change happens in the audit tool repo, not the marketing site. Tracked as a follow-up here so the handoff doc is complete.

---

## 5. Proof — embed real audits

The audit tool produces persistent `/audit/[id]` URLs. With customer consent, anonymize 3–5 and embed thumbnails on the homepage under "Honest work. Honest feedback."

Format:

- Trade + city ("HVAC contractor, Bentonville")
- Before/after scores
- Link to full audit page

**SEO bonus:** These URLs become AI-citable proof that the tool produces real, dated, structured local SEO assessments. Add `dateModified` to each via schema.

---

## 6. Trade × city programmatic pages

Current `/service-areas` and `/services` pages exist but no trade × city combinations.

**Generate:**

- `/local-seo/hvac/rogers`
- `/local-seo/hvac/bentonville`
- `/local-seo/plumbers/fayetteville`
- `/local-seo/roofers/springdale`
- `/local-seo/electricians/siloam-springs`
- ... (trade × city matrix)

**Each page should include:**

- H1: "Local SEO for {trade} in {city}, AR"
- Map Pack screenshot showing top 3 in that city for that trade (can be static or dynamic)
- 3 fixable problems (reuse homepage block)
- CTA: pre-filled audit link `audit.localsearchally.com?trade={trade}&city={city}`
- FAQ block keyed to that trade × city
- Internal links to nearby cities and other trades

**Quality gate:** Don't ship thin pages. If a trade × city combo has no real differentiation, don't publish it. The audit tool's existing programmatic SEO logic in `lib/keywords.ts` and the prefetch pipeline can inform what's worth a page.

---

## 7. Auth continuity

When the audit tool collects an email and creates an account, it goes into the same Supabase project this repo uses.

**The marketing site needs:**

- A "Log in" link in the top nav → `audit.localsearchally.com/login`
- A "Dashboard" link if a session cookie is present (optional — check `sb-*` cookies on `.localsearchally.com` domain)

**Supabase config check:** Cookies must be scoped to `.localsearchally.com` (leading dot) so they're shared across both subdomains. Verify in Supabase project settings → Auth → URL Configuration.

---

## 8. Footer + nav consistency

**Top nav across both domains** should show the same primary links:

- Free Audit (→ audit tool)
- Services
- Pricing
- About
- Log in

**Footer:** Same structure on both, same legal links (`/privacy`, `/terms`), same phone, same address.

---

## 9. Email + drip alignment

The audit tool sends transactional email via Resend (`/api/email`). The marketing site likely has its own contact form sending elsewhere.

**Unify:**

- Single "from" address: `chad@localsearchally.com`
- Shared email signature / footer
- When a free audit completes anonymously, drip sequence should mention both DIY ($49) and done-for-you ($497) options.
- Cancel drip when the user either signs up for Pro OR books a call (this repo has `lib/cancel-drips.ts` — make sure the marketing site's contact form hits the same kill switch).

---

## 10. Tracking

Both domains should report into the same analytics property. At minimum tag these events consistently:

| Event                    | Where fired                          |
| ------------------------ | ------------------------------------ |
| `audit_started`          | audit tool, form submit              |
| `audit_completed`        | audit tool, results render           |
| `signup_started`         | audit tool, /signup                  |
| `subscription_started`   | audit tool, PayPal webhook           |
| `contact_form_submitted` | marketing site                       |
| `call_booked`            | marketing site, booking confirmation |

Use the same UTM convention on every cross-domain link (e.g. `?utm_source=marketing-site&utm_medium=hero-cta`).

---

## Implementation checklist (in order)

1. [ ] Decide pricing ladder (recommended: 3-tier $49 / $199 / $497)
2. [ ] Extract brand tokens from `app/globals.css` → shared CSS on marketing site
3. [ ] Add secondary "Book a call" CTA under hero
4. [ ] Fix "problem.It's" missing space
5. [ ] Wire query-param prefill on audit form (this repo)
6. [ ] Add "Have Chad fix this" CTA on audit results page (this repo)
7. [ ] Scope Supabase auth cookie to `.localsearchally.com`
8. [ ] Add "Log in" link to marketing site nav
9. [ ] Embed 3 anonymized sample audits on homepage
10. [ ] Generate trade × city landing pages
11. [ ] Unify email "from" address + drip cancellation
12. [ ] Standardize cross-domain UTM + event tracking

Items 5, 6, 7 happen in this repo. The rest happen on the marketing site.

---

## Out of scope for this handoff

- Redesigning the marketing site
- Replatforming
- Blog content strategy
- Paid acquisition

This doc is strictly about removing friction between localsearchally.com and audit.localsearchally.com so they feel like one product.
