# Graph Report - .  (2026-05-01)

## Corpus Check
- 44 files · ~159,660 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 151 nodes · 167 edges · 19 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 10 edges
2. `buildAuditPrompt()` - 8 edges
3. `emailShell()` - 7 edges
4. `Rate-Limit Proxy Middleware` - 5 edges
5. `getAudit()` - 4 edges
6. `POST()` - 3 edges
7. `buildDripDay2Html()` - 3 edges
8. `buildDripDay5Html()` - 3 edges
9. `buildDripDay9Html()` - 3 edges
10. `buildDripDay14Html()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `buildAuditPrompt()` --calls--> `formatGBPBlock()`  [INFERRED]
  app/api/audit/route.ts → lib/prefetch.ts
- `buildAuditPrompt()` --calls--> `formatPageSpeedBlock()`  [INFERRED]
  app/api/audit/route.ts → lib/prefetch.ts
- `buildAuditPrompt()` --calls--> `formatWebsiteBlock()`  [INFERRED]
  app/api/audit/route.ts → lib/prefetch.ts
- `buildAuditPrompt()` --calls--> `formatBacklinksBlock()`  [INFERRED]
  app/api/audit/route.ts → lib/prefetch.ts
- `buildAuditPrompt()` --calls--> `formatReviewsBlock()`  [INFERRED]
  app/api/audit/route.ts → lib/prefetch.ts

## Hyperedges (group relationships)
- **Landing Page Component Set** —  [EXTRACTED]
- **Shared Page Chrome** —  [EXTRACTED]
- **Pre-Fetch Data Sources** —  [EXTRACTED]
- **Landing Page Visual Assets** —  [INFERRED]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.0
Nodes (21): Root Layout, Home Page (/ redirect target), DiagnosticGrid, FaqSection, FinalCtaSection, Free Local SEO Audit Page, globals.css, HeroSection (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.0
Nodes (21): AGENTS.md Agent Rules, API Route: /api/audit, POST /api/email Route, Audit Detail Page, Build Spec (docs/build-spec.md), Audit Report Preview Image, Map Pack Visibility Image, Visibility Transformation Image (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.0
Nodes (10): buildAuditPrompt(), extractJsonLdBlocks(), fetchWebsiteData(), formatBacklinksBlock(), formatGBPBlock(), formatPageSpeedBlock(), formatReviewsBlock(), formatSerperBlock() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.0
Nodes (5): audit.module.css, AuditTool, handleSubmit(), validate(), Framer Motion

### Community 4 - "Community 4"
Cohesion: 0.0
Nodes (10): buildDripDay14Html(), buildDripDay21Html(), buildDripDay2Html(), buildDripDay5Html(), buildDripDay9Html(), buildEmailHtml(), buildReauditReminderHtml(), emailShell() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.0
Nodes (4): callClaude(), POST(), sanitizeString(), sanitizeUrl()

### Community 6 - "Community 6"
Cohesion: 0.0
Nodes (4): AuditPage(), generateMetadata(), getAudit(), getSupabase()

### Community 7 - "Community 7"
Cohesion: 0.0
Nodes (5): getRatelimiter(), proxy(), Rate-Limit Proxy Middleware, Upstash Ratelimit, Upstash Redis

### Community 23 - "Community 23"
Cohesion: 0.0
Nodes (2): PostCSS Config, Tailwind CSS (PostCSS plugin)

### Community 24 - "Community 24"
Cohesion: 0.0
Nodes (2): ESLint Config, Next.js Type Declarations

### Community 25 - "Community 25"
Cohesion: 0.0
Nodes (2): SiteFooter, SiteFooter.module.css

### Community 26 - "Community 26"
Cohesion: 0.0
Nodes (2): SiteNav Component, LocalSearchAlly Main Site

### Community 34 - "Community 34"
Cohesion: 0.0
Nodes (1): README

### Community 35 - "Community 35"
Cohesion: 0.0
Nodes (1): Step 1 Visual

### Community 36 - "Community 36"
Cohesion: 0.0
Nodes (1): Step 2 Visual

### Community 37 - "Community 37"
Cohesion: 0.0
Nodes (1): Step 3 Visual

### Community 38 - "Community 38"
Cohesion: 0.0
Nodes (1): Testimonial Avatars

### Community 39 - "Community 39"
Cohesion: 0.0
Nodes (1): OG Image

### Community 40 - "Community 40"
Cohesion: 0.0
Nodes (1): How It Works Steps Image

## Knowledge Gaps
- **Thin community `Community 23`** (2 nodes): `PostCSS Config`, `Tailwind CSS (PostCSS plugin)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `ESLint Config`, `Next.js Type Declarations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `SiteFooter`, `SiteFooter.module.css`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `SiteNav Component`, `LocalSearchAlly Main Site`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Step 1 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `Step 2 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `Step 3 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `Testimonial Avatars`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `OG Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `How It Works Steps Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.