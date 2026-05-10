# Graph Report - lsa-audit-tool  (2026-05-09)

## Corpus Check
- 66 files · ~173,975 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 158 nodes · 131 edges · 20 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 10 edges
2. `buildAuditPrompt()` - 9 edges
3. `createServerClient()` - 8 edges
4. `emailShell()` - 7 edges
5. `getSupabase()` - 7 edges
6. `POST()` - 5 edges
7. `POST()` - 4 edges
8. `proxy()` - 3 edges
9. `computeDeltas()` - 3 edges
10. `deleteAudit()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/signout/route.ts → lib/supabase.ts
- `GET()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/callback/route.ts → lib/supabase.ts
- `deleteAudit()` --calls--> `getSupabase()`  [INFERRED]
  app/actions/deleteAudit.ts → lib/supabase.ts
- `POST()` --calls--> `getSupabase()`  [INFERRED]
  app/api/auth/save-audit/route.ts → lib/supabase.ts
- `POST()` --calls--> `getSupabase()`  [INFERRED]
  app/api/auth/check-invite/route.ts → lib/supabase.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (11): buildAuditPrompt(), callClaude(), formatGBPBlock(), formatPageSpeedBlock(), formatBacklinksBlock(), formatReviewsBlock(), formatSerperBlock(), extractJsonLdBlocks() (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (8): deleteAudit(), GET(), createBrowserClient(), createServerClient(), handleSubmit(), getRatelimiter(), proxy(), POST()

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (7): POST(), GET(), POST(), sleep(), buildGrid(), getSupabase(), POST()

### Community 3 - "Community 3"
Cohesion: 0.44
Nodes (10): buildDripDay14Html(), buildDripDay21Html(), buildDripDay2Html(), buildDripDay5Html(), buildDripDay9Html(), buildEmailHtml(), buildReauditReminderHtml(), emailShell() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (3): POST(), sanitizeString(), sanitizeUrl()

### Community 5 - "Community 5"
Cohesion: 0.6
Nodes (4): computeAICitabilitySignals(), extractServiceKeywords(), formatAICitabilityBlock(), normalisePhone()

### Community 6 - "Community 6"
Cohesion: 0.83
Nodes (3): computeDeltas(), loadScan(), runScan()

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): handleSubmit(), validate()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (2): getSuggestedKeywords(), normalizeTrade()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (3): Build Spec (docs/build-spec.md), Map Pack Visibility Image, Visibility Transformation Image

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): README

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): AGENTS.md Agent Rules

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): Step 1 Visual

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): Step 2 Visual

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): Step 3 Visual

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): Testimonial Avatars

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): OG Image

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Audit Report Preview Image

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): How It Works Steps Image

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): LocalSearchAlly Main Site

## Knowledge Gaps
- **Thin community `Community 9`** (3 nodes): `AuditTool.tsx`, `handleSubmit()`, `validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (3 nodes): `getSuggestedKeywords()`, `normalizeTrade()`, `keywords.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `AGENTS.md Agent Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `Step 1 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `Step 2 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `Step 3 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `Testimonial Avatars`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `OG Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Audit Report Preview Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `How It Works Steps Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `LocalSearchAlly Main Site`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Community 1` to `Community 2`, `Community 4`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `buildAuditPrompt()` connect `Community 0` to `Community 4`, `Community 5`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `buildAuditPrompt()` (e.g. with `formatPageSpeedBlock()` and `formatWebsiteBlock()`) actually correct?**
  _`buildAuditPrompt()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `createServerClient()` (e.g. with `proxy()` and `POST()`) actually correct?**
  _`createServerClient()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `getSupabase()` (e.g. with `deleteAudit()` and `POST()`) actually correct?**
  _`getSupabase()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._