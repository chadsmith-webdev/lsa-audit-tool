# Graph Report - lsa-audit-tool  (2026-05-09)

## Corpus Check
- 70 files · ~177,433 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 174 nodes · 153 edges · 24 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.78)
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 10 edges
2. `createServerClient()` - 10 edges
3. `buildAuditPrompt()` - 9 edges
4. `getSupabase()` - 9 edges
5. `emailShell()` - 7 edges
6. `POST()` - 6 edges
7. `POST()` - 6 edges
8. `POST()` - 5 edges
9. `POST()` - 4 edges
10. `proxy()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `buildGrid()`  [INFERRED]
  app/api/grid/route.ts → lib/grid.ts
- `proxy()` --calls--> `createServerClient()`  [INFERRED]
  proxy.ts → lib/supabase.ts
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/signout/route.ts → lib/supabase.ts
- `GET()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/callback/route.ts → lib/supabase.ts
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/api/tools/gbp/posts/route.ts → lib/supabase.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (12): deleteAudit(), GET(), POST(), GET(), POST(), sleep(), createBrowserClient(), createServerClient() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (7): buildAuditPrompt(), callClaude(), formatGBPBlock(), formatPageSpeedBlock(), formatBacklinksBlock(), formatReviewsBlock(), formatSerperBlock()

### Community 2 - "Community 2"
Cohesion: 0.44
Nodes (10): buildDripDay14Html(), buildDripDay21Html(), buildDripDay2Html(), buildDripDay5Html(), buildDripDay9Html(), buildEmailHtml(), buildReauditReminderHtml(), emailShell() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (3): POST(), sanitizeString(), sanitizeUrl()

### Community 4 - "Community 4"
Cohesion: 0.7
Nodes (4): buildPrompt(), isTheme(), parsePosts(), POST()

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

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (1): buildGrid()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): getRatelimiter(), proxy()

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (2): handleSubmit(), validate()

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (2): getSuggestedKeywords(), normalizeTrade()

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (3): Build Spec (docs/build-spec.md), Map Pack Visibility Image, Visibility Transformation Image

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): README

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): AGENTS.md Agent Rules

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Step 1 Visual

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Step 2 Visual

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Step 3 Visual

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): Testimonial Avatars

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): OG Image

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): Audit Report Preview Image

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): How It Works Steps Image

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): LocalSearchAlly Main Site

## Knowledge Gaps
- **Thin community `Community 10`** (4 nodes): `buildGrid()`, `rankColor()`, `rankLabel()`, `grid.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (3 nodes): `getRatelimiter()`, `proxy()`, `proxy.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (3 nodes): `AuditTool.tsx`, `handleSubmit()`, `validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (3 nodes): `getSuggestedKeywords()`, `normalizeTrade()`, `keywords.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `AGENTS.md Agent Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `Step 1 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `Step 2 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Step 3 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `Testimonial Avatars`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `OG Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `Audit Report Preview Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `How It Works Steps Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `LocalSearchAlly Main Site`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Community 0` to `Community 5`, `Community 3`, `Community 12`, `Community 4`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `buildAuditPrompt()` connect `Community 1` to `Community 3`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `createServerClient()` (e.g. with `proxy()` and `POST()`) actually correct?**
  _`createServerClient()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `buildAuditPrompt()` (e.g. with `formatPageSpeedBlock()` and `formatWebsiteBlock()`) actually correct?**
  _`buildAuditPrompt()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `getSupabase()` (e.g. with `deleteAudit()` and `POST()`) actually correct?**
  _`getSupabase()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._