# Graph Report - lsa-audit-tool  (2026-05-11)

## Corpus Check
- 116 files · ~207,332 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 307 nodes · 348 edges · 29 communities detected
- Extraction: 72% EXTRACTED · 28% INFERRED · 0% AMBIGUOUS · INFERRED: 97 edges (avg confidence: 0.79)
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]

## God Nodes (most connected - your core abstractions)
1. `getSupabase()` - 27 edges
2. `createServerClient()` - 25 edges
3. `proGateApi()` - 12 edges
4. `POST()` - 10 edges
5. `POST()` - 9 edges
6. `buildAuditPrompt()` - 9 edges
7. `POST()` - 8 edges
8. `POST()` - 7 edges
9. `POST()` - 7 edges
10. `POST()` - 7 edges

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
Cohesion: 0.09
Nodes (13): deleteAudit(), POST(), GET(), POST(), sleep(), buildGrid(), createBrowserClient(), createServerClient() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (15): POST(), cancelSubscription(), fetchSubscription(), getAccessToken(), getPlanId(), verifyWebhookSignature(), getSupabase(), GET() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (16): buildPrompt(), parsePayload(), POST(), buildPrompt(), parsePayload(), POST(), proGateApi(), requireProAccess() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (11): buildAuditPrompt(), callClaude(), computeAICitabilitySignals(), extractServiceKeywords(), formatAICitabilityBlock(), normalisePhone(), formatGBPBlock(), formatPageSpeedBlock() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (13): createLocalPost(), ctaLabelToActionType(), friendlyFor(), GbpApiError, getAccessTokenForUser(), getConnection(), listAccounts(), listAllLocations() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (9): buildPrompt(), isTone(), parseSuggestions(), POST(), toSuggestions(), extractJsonLdBlocks(), fetchWebsiteData(), formatWebsiteBlock() (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.44
Nodes (10): buildDripDay14Html(), buildDripDay21Html(), buildDripDay2Html(), buildDripDay5Html(), buildDripDay9Html(), buildEmailHtml(), buildReauditReminderHtml(), emailShell() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (7): GET(), buildAuthUrl(), decodeIdTokenEmail(), exchangeCodeForTokens(), getOAuthEnv(), refreshAccessToken(), GET()

### Community 8 - "Community 8"
Cohesion: 0.52
Nodes (6): buildFaqSchema(), buildLocalBusinessSchema(), buildPrompt(), jsonLdScript(), parsePayload(), POST()

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (3): POST(), sanitizeString(), sanitizeUrl()

### Community 10 - "Community 10"
Cohesion: 0.47
Nodes (4): buildPrompt(), parseDescriptions(), POST(), directoriesForTrade()

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (2): loadLocations(), openPicker()

### Community 12 - "Community 12"
Cohesion: 0.7
Nodes (4): buildPrompt(), isTheme(), parsePosts(), POST()

### Community 13 - "Community 13"
Cohesion: 0.7
Nodes (4): buildPrompt(), isTone(), parseVariants(), POST()

### Community 17 - "Community 17"
Cohesion: 0.83
Nodes (3): computeDeltas(), loadScan(), runScan()

### Community 19 - "Community 19"
Cohesion: 0.83
Nodes (3): generateGuidance(), POST(), runScan()

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (2): handleSubmit(), validate()

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (2): getSuggestedKeywords(), normalizeTrade()

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (3): Build Spec (docs/build-spec.md), Map Pack Visibility Image, Visibility Transformation Image

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): README

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): AGENTS.md Agent Rules

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): Step 1 Visual

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (1): Step 2 Visual

### Community 86 - "Community 86"
Cohesion: 1.0
Nodes (1): Step 3 Visual

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (1): Testimonial Avatars

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (1): OG Image

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (1): Audit Report Preview Image

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (1): How It Works Steps Image

### Community 91 - "Community 91"
Cohesion: 1.0
Nodes (1): LocalSearchAlly Main Site

## Knowledge Gaps
- **Thin community `Community 11`** (5 nodes): `GbpConnection.tsx`, `handleDisconnect()`, `handleSelect()`, `loadLocations()`, `openPicker()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (3 nodes): `AuditTool.tsx`, `handleSubmit()`, `validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (3 nodes): `getSuggestedKeywords()`, `normalizeTrade()`, `keywords.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `AGENTS.md Agent Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `Step 1 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `Step 2 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `Step 3 Visual`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `Testimonial Avatars`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `OG Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `Audit Report Preview Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `How It Works Steps Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `LocalSearchAlly Main Site`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 12`, `Community 13`, `Community 19`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `getSupabase()` connect `Community 1` to `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 12`, `Community 13`, `Community 19`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `buildAuditPrompt()` connect `Community 3` to `Community 9`, `Community 5`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `getSupabase()` (e.g. with `deleteAudit()` and `POST()`) actually correct?**
  _`getSupabase()` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `createServerClient()` (e.g. with `proxy()` and `POST()`) actually correct?**
  _`createServerClient()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `proGateApi()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`proGateApi()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `POST()` (e.g. with `createServerClient()` and `proGateApi()`) actually correct?**
  _`POST()` has 3 INFERRED edges - model-reasoned connections that need verification._