# Graph Report - lsa-audit-tool  (2026-05-09)

## Corpus Check
- 68 files · ~175,679 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 166 nodes · 142 edges · 22 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.78)
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
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 10 edges
2. `buildAuditPrompt()` - 9 edges
3. `createServerClient()` - 9 edges
4. `getSupabase()` - 8 edges
5. `emailShell()` - 7 edges
6. `POST()` - 6 edges
7. `POST()` - 5 edges
8. `POST()` - 4 edges
9. `proxy()` - 3 edges
10. `computeDeltas()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/signout/route.ts → lib/supabase.ts
- `GET()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/callback/route.ts → lib/supabase.ts
- `deleteAudit()` --calls--> `createServerClient()`  [INFERRED]
  app/actions/deleteAudit.ts → lib/supabase.ts
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/api/tools/gbp/description/route.ts → lib/supabase.ts
- `POST()` --calls--> `getSupabase()`  [INFERRED]
  app/api/tools/gbp/description/route.ts → lib/supabase.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (9): GET(), GET(), POST(), sleep(), buildGrid(), createServerClient(), getRatelimiter(), proxy() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (7): buildAuditPrompt(), callClaude(), formatGBPBlock(), formatPageSpeedBlock(), formatBacklinksBlock(), formatReviewsBlock(), formatSerperBlock()

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (6): deleteAudit(), POST(), createBrowserClient(), getSupabase(), handleSubmit(), POST()

### Community 3 - "Community 3"
Cohesion: 0.44
Nodes (10): buildDripDay14Html(), buildDripDay21Html(), buildDripDay2Html(), buildDripDay5Html(), buildDripDay9Html(), buildEmailHtml(), buildReauditReminderHtml(), emailShell() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (3): POST(), sanitizeString(), sanitizeUrl()

### Community 5 - "Community 5"
Cohesion: 0.7
Nodes (4): buildPrompt(), isTone(), parseVariants(), POST()

### Community 6 - "Community 6"
Cohesion: 0.6
Nodes (4): computeAICitabilitySignals(), extractServiceKeywords(), formatAICitabilityBlock(), normalisePhone()

### Community 7 - "Community 7"
Cohesion: 0.6
Nodes (4): extractJsonLdBlocks(), fetchWebsiteData(), formatWebsiteBlock(), stripTags()

### Community 8 - "Community 8"
Cohesion: 0.83
Nodes (3): computeDeltas(), loadScan(), runScan()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): handleSubmit(), validate()

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (2): getSuggestedKeywords(), normalizeTrade()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (3): Build Spec (docs/build-spec.md), Map Pack Visibility Image, Visibility Transformation Image

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): README

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): AGENTS.md Agent Rules

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): Step 1 Visual

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): Step 2 Visual

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Step 3 Visual

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Testimonial Avatars

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): OG Image

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Audit Report Preview Image

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): How It Works Steps Image

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): LocalSearchAlly Main Site

## Knowledge Gaps
- **Thin community `Community 12`** (3 nodes): `AuditTool.tsx`, `handleSubmit()`, `validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (3 nodes): `getSuggestedKeywords()`, `normalizeTrade()`, `keywords.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `AGENTS.md Agent Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `Step 1 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `Step 2 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Step 3 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `Testimonial Avatars`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `OG Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Audit Report Preview Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `How It Works Steps Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `LocalSearchAlly Main Site`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Community 0` to `Community 2`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `buildAuditPrompt()` connect `Community 1` to `Community 4`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `buildAuditPrompt()` (e.g. with `formatPageSpeedBlock()` and `formatWebsiteBlock()`) actually correct?**
  _`buildAuditPrompt()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `createServerClient()` (e.g. with `proxy()` and `POST()`) actually correct?**
  _`createServerClient()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `getSupabase()` (e.g. with `deleteAudit()` and `POST()`) actually correct?**
  _`getSupabase()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._