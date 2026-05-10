# Graph Report - lsa-audit-tool  (2026-05-10)

## Corpus Check
- 87 files · ~188,116 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 232 nodes · 242 edges · 26 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.79)
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]

## God Nodes (most connected - your core abstractions)
1. `createServerClient()` - 18 edges
2. `getSupabase()` - 16 edges
3. `POST()` - 10 edges
4. `buildAuditPrompt()` - 9 edges
5. `POST()` - 7 edges
6. `emailShell()` - 7 edges
7. `getAccessTokenForUser()` - 7 edges
8. `GET()` - 6 edges
9. `POST()` - 6 edges
10. `POST()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/auth/signout/route.ts → lib/supabase.ts
- `GET()` --calls--> `createServerClient()`  [INFERRED]
  app/api/gbp/oauth/callback/route.ts → lib/supabase.ts
- `GET()` --calls--> `decodeIdTokenEmail()`  [INFERRED]
  app/api/gbp/oauth/callback/route.ts → lib/gbp-oauth.ts
- `GET()` --calls--> `getSupabase()`  [INFERRED]
  app/api/gbp/oauth/callback/route.ts → lib/supabase.ts
- `POST()` --calls--> `createServerClient()`  [INFERRED]
  app/api/tools/onpage/route.ts → lib/supabase.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (16): deleteAudit(), POST(), POST(), getAccessTokenForUser(), getConnection(), createBrowserClient(), createServerClient(), getSupabase() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (11): buildAuditPrompt(), callClaude(), computeAICitabilitySignals(), extractServiceKeywords(), formatAICitabilityBlock(), normalisePhone(), formatGBPBlock(), formatPageSpeedBlock() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.26
Nodes (9): createLocalPost(), ctaLabelToActionType(), friendlyFor(), GbpApiError, listAccounts(), listAllLocations(), listLocationsForAccount(), updateDescription() (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (7): GET(), buildAuthUrl(), decodeIdTokenEmail(), exchangeCodeForTokens(), getOAuthEnv(), refreshAccessToken(), GET()

### Community 4 - "Community 4"
Cohesion: 0.44
Nodes (10): buildDripDay14Html(), buildDripDay21Html(), buildDripDay2Html(), buildDripDay5Html(), buildDripDay9Html(), buildEmailHtml(), buildReauditReminderHtml(), emailShell() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (9): buildPrompt(), isTone(), parseSuggestions(), POST(), toSuggestions(), extractJsonLdBlocks(), fetchWebsiteData(), formatWebsiteBlock() (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (4): GET(), POST(), sleep(), buildGrid()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (3): POST(), sanitizeString(), sanitizeUrl()

### Community 8 - "Community 8"
Cohesion: 0.7
Nodes (4): buildPrompt(), isTheme(), parsePosts(), POST()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (2): loadLocations(), openPicker()

### Community 10 - "Community 10"
Cohesion: 0.7
Nodes (4): buildPrompt(), isTone(), parseVariants(), POST()

### Community 11 - "Community 11"
Cohesion: 0.7
Nodes (4): buildReplyPrompt(), buildRequestPrompt(), parseVariants(), POST()

### Community 14 - "Community 14"
Cohesion: 0.83
Nodes (3): computeDeltas(), loadScan(), runScan()

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (2): handleSubmit(), validate()

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (2): getSuggestedKeywords(), normalizeTrade()

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (3): Build Spec (docs/build-spec.md), Map Pack Visibility Image, Visibility Transformation Image

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): README

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): AGENTS.md Agent Rules

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): Step 1 Visual

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): Step 2 Visual

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (1): Step 3 Visual

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (1): Testimonial Avatars

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (1): OG Image

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (1): Audit Report Preview Image

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (1): How It Works Steps Image

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (1): LocalSearchAlly Main Site

## Knowledge Gaps
- **Thin community `Community 9`** (5 nodes): `GbpConnection.tsx`, `handleDisconnect()`, `handleSelect()`, `loadLocations()`, `openPicker()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (3 nodes): `AuditTool.tsx`, `handleSubmit()`, `validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (3 nodes): `getSuggestedKeywords()`, `normalizeTrade()`, `keywords.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `AGENTS.md Agent Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `Step 1 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `Step 2 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `Step 3 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `Testimonial Avatars`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `OG Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `Audit Report Preview Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `How It Works Steps Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `LocalSearchAlly Main Site`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Community 0` to `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `getSupabase()` connect `Community 0` to `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `buildAuditPrompt()` connect `Community 1` to `Community 5`, `Community 7`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `createServerClient()` (e.g. with `proxy()` and `POST()`) actually correct?**
  _`createServerClient()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `getSupabase()` (e.g. with `deleteAudit()` and `POST()`) actually correct?**
  _`getSupabase()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `buildAuditPrompt()` (e.g. with `formatPageSpeedBlock()` and `formatWebsiteBlock()`) actually correct?**
  _`buildAuditPrompt()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `POST()` (e.g. with `createServerClient()` and `getSupabase()`) actually correct?**
  _`POST()` has 3 INFERRED edges - model-reasoned connections that need verification._