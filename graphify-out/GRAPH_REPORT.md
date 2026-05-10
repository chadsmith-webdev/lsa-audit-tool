# Graph Report - lsa-audit-tool  (2026-05-10)

## Corpus Check
- 72 files · ~180,557 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 182 nodes · 164 edges · 24 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.78)
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]

## God Nodes (most connected - your core abstractions)
1. `createServerClient()` - 11 edges
2. `POST()` - 10 edges
3. `getSupabase()` - 10 edges
4. `buildAuditPrompt()` - 9 edges
5. `emailShell()` - 7 edges
6. `POST()` - 6 edges
7. `POST()` - 6 edges
8. `POST()` - 6 edges
9. `POST()` - 5 edges
10. `POST()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `proxy()` --calls--> `createServerClient()`  [INFERRED]
  proxy.ts → lib/supabase.ts
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/signout/route.ts → lib/supabase.ts
- `GET()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/callback/route.ts → lib/supabase.ts
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/api/tools/gbp/posts/route.ts → lib/supabase.ts
- `POST()` --calls--> `getSupabase()`  [INFERRED]
  app/api/tools/gbp/posts/route.ts → lib/supabase.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (13): deleteAudit(), GET(), POST(), GET(), POST(), sleep(), buildGrid(), createBrowserClient() (+5 more)

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
Cohesion: 0.7
Nodes (4): buildReplyPrompt(), buildRequestPrompt(), parseVariants(), POST()

### Community 7 - "Community 7"
Cohesion: 0.6
Nodes (4): computeAICitabilitySignals(), extractServiceKeywords(), formatAICitabilityBlock(), normalisePhone()

### Community 8 - "Community 8"
Cohesion: 0.6
Nodes (4): extractJsonLdBlocks(), fetchWebsiteData(), formatWebsiteBlock(), stripTags()

### Community 9 - "Community 9"
Cohesion: 0.83
Nodes (3): computeDeltas(), loadScan(), runScan()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): getRatelimiter(), proxy()

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (2): handleSubmit(), validate()

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (2): getSuggestedKeywords(), normalizeTrade()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (3): Build Spec (docs/build-spec.md), Map Pack Visibility Image, Visibility Transformation Image

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): README

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): AGENTS.md Agent Rules

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Step 1 Visual

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Step 2 Visual

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): Step 3 Visual

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): Testimonial Avatars

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): OG Image

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): Audit Report Preview Image

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): How It Works Steps Image

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (1): LocalSearchAlly Main Site

## Knowledge Gaps
- **Thin community `Community 12`** (3 nodes): `getRatelimiter()`, `proxy()`, `proxy.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (3 nodes): `AuditTool.tsx`, `handleSubmit()`, `validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (3 nodes): `getSuggestedKeywords()`, `normalizeTrade()`, `keywords.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `AGENTS.md Agent Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `Step 1 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Step 2 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `Step 3 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `Testimonial Avatars`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `OG Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `Audit Report Preview Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `How It Works Steps Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `LocalSearchAlly Main Site`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Community 0` to `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 12`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `buildAuditPrompt()` connect `Community 1` to `Community 8`, `Community 3`, `Community 7`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createServerClient()` (e.g. with `proxy()` and `POST()`) actually correct?**
  _`createServerClient()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `getSupabase()` (e.g. with `deleteAudit()` and `POST()`) actually correct?**
  _`getSupabase()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `buildAuditPrompt()` (e.g. with `formatPageSpeedBlock()` and `formatWebsiteBlock()`) actually correct?**
  _`buildAuditPrompt()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._