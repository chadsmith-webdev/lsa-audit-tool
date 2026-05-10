# Graph Report - lsa-audit-tool  (2026-05-10)

## Corpus Check
- 97 files · ~196,069 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 262 nodes · 278 edges · 28 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.79)
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
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]

## God Nodes (most connected - your core abstractions)
1. `createServerClient()` - 21 edges
2. `getSupabase()` - 19 edges
3. `POST()` - 10 edges
4. `buildAuditPrompt()` - 9 edges
5. `POST()` - 8 edges
6. `POST()` - 7 edges
7. `emailShell()` - 7 edges
8. `getAccessTokenForUser()` - 7 edges
9. `GET()` - 6 edges
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
- `deleteAudit()` --calls--> `getSupabase()`  [INFERRED]
  app/actions/deleteAudit.ts → lib/supabase.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (16): POST(), createLocalPost(), ctaLabelToActionType(), friendlyFor(), GbpApiError, getAccessTokenForUser(), getConnection(), listAccounts() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (13): deleteAudit(), buildPrompt(), isTone(), parseVariants(), POST(), POST(), createBrowserClient(), createServerClient() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (11): buildAuditPrompt(), callClaude(), computeAICitabilitySignals(), extractServiceKeywords(), formatAICitabilityBlock(), normalisePhone(), formatGBPBlock(), formatPageSpeedBlock() (+3 more)

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
Cohesion: 0.52
Nodes (6): buildFaqSchema(), buildLocalBusinessSchema(), buildPrompt(), jsonLdScript(), parsePayload(), POST()

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (3): POST(), sanitizeString(), sanitizeUrl()

### Community 9 - "Community 9"
Cohesion: 0.47
Nodes (4): buildPrompt(), parseDescriptions(), POST(), directoriesForTrade()

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (2): loadLocations(), openPicker()

### Community 11 - "Community 11"
Cohesion: 0.7
Nodes (4): buildPrompt(), isTheme(), parsePosts(), POST()

### Community 12 - "Community 12"
Cohesion: 0.7
Nodes (4): buildReplyPrompt(), buildRequestPrompt(), parseVariants(), POST()

### Community 16 - "Community 16"
Cohesion: 0.83
Nodes (3): computeDeltas(), loadScan(), runScan()

### Community 18 - "Community 18"
Cohesion: 0.83
Nodes (3): buildPrompt(), parsePayload(), POST()

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (2): handleSubmit(), validate()

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (2): getSuggestedKeywords(), normalizeTrade()

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (3): Build Spec (docs/build-spec.md), Map Pack Visibility Image, Visibility Transformation Image

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (1): README

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (1): AGENTS.md Agent Rules

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (1): Step 1 Visual

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (1): Step 2 Visual

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (1): Step 3 Visual

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (1): Testimonial Avatars

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (1): OG Image

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (1): Audit Report Preview Image

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (1): How It Works Steps Image

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): LocalSearchAlly Main Site

## Knowledge Gaps
- **Thin community `Community 10`** (5 nodes): `GbpConnection.tsx`, `handleDisconnect()`, `handleSelect()`, `loadLocations()`, `openPicker()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (3 nodes): `AuditTool.tsx`, `handleSubmit()`, `validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (3 nodes): `getSuggestedKeywords()`, `normalizeTrade()`, `keywords.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `AGENTS.md Agent Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `Step 1 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `Step 2 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `Step 3 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `Testimonial Avatars`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `OG Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `Audit Report Preview Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `How It Works Steps Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `LocalSearchAlly Main Site`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Community 1` to `Community 0`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 11`, `Community 12`, `Community 18`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `getSupabase()` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 12`, `Community 18`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `buildAuditPrompt()` connect `Community 2` to `Community 8`, `Community 5`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `createServerClient()` (e.g. with `proxy()` and `POST()`) actually correct?**
  _`createServerClient()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `getSupabase()` (e.g. with `deleteAudit()` and `POST()`) actually correct?**
  _`getSupabase()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `buildAuditPrompt()` (e.g. with `formatPageSpeedBlock()` and `formatWebsiteBlock()`) actually correct?**
  _`buildAuditPrompt()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `POST()` (e.g. with `createServerClient()` and `getSupabase()`) actually correct?**
  _`POST()` has 2 INFERRED edges - model-reasoned connections that need verification._