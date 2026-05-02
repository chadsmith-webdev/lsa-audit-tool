# AI Citability & Trust Score — Design Spec

Date: 2026-05-02 | Status: Approved

## Overview

Add "AI Citability & Trust Score" as a bonus section to the audit. Evaluates how easily an AI (Gemini, SGE, ChatGPT) can verify and recommend a local contractor. Does not affect the overall score average. Paired with landing page copy updates targeting the ad term "how to optimize google business profile."

## Architecture

New in prefetch.ts:

* AICitabilitySignals interface  
* computeAICitabilitySignals(gbp, website, reviews) — pure synchronous function, zero latency (called after Promise.all)  
* formatAICitabilityBlock() — formats the pre-fetch block for the prompt

Grounding check (deterministic code): Extracts service keywords from GBP name → checks website title/H1/H2s \+ phone match → groundingScore (0–100%) \+ groundingMismatches\[\]

Photo freshness (approximated): photoCount ≥ 10 → "strong" | \< 5 → "weak" | otherwise → "unknown"

Review texts: Raw array from existing ReviewsData, sliced to 10, passed to Claude for semantic analysis.

New in route.ts:

* Call computeAICitabilitySignals() post-Promise.all  
* Append AI\_CITABILITY block to buildAuditPrompt()  
* Add section 8\. ai\_citability to system prompt  
* Add optional fields to AuditResult: ai\_citability\_score?: number, ai\_citability\_section?: AICitabilitySection

## Types

## System Prompt Addition

Section 8 ai\_citability — BONUS SECTION, does not affect overall\_score. Scoring rules:

* All three sub-signals strong → 8–10 (green)  
* Any one weak → 5–7 (yellow)  
* Grounding weak OR (review density \+ photo both weak) → 1–4 (red)  
* No website → max score 5  
* Review density thresholds: ≥30% service+location nouns \= strong, 10–29% \= partial, \<10% \= weak  
* Voice: "an AI that can't verify you skips you"

## Pre-fetch Block Format

## UI Treatment

* Rendered below the 7 core cards, above Top 3 Actions  
* Separator labeled "Bonus Analysis" with \--carolina-dim background tint  
* Card accent: \--carolina / \--carolina-dark (brand steel blue — not green/yellow/red)  
* Sub-signal row: three mini-badges (Grounding, Review Density, Photo Freshness) each independently green/yellow/red  
* Overall score gauge unchanged. AI score appears only within its card.  
* ai\_citability\_section is optional — cached audits without it render normally

## Landing Page Updates

Components to update: HeroSection, DiagnosticGrid (add 8th item), WhatWeCheckSection (add 8th check).

Hook: *"Most GBP guides were written before AI search existed. Get a free audit that scores how visible you are to Google's AI — not just its algorithm."*

## Files to Modify

| File | Change |
| ----- | ----- |
| prefetch.ts | AICitabilitySignals interface \+ computeAICitabilitySignals() \+ formatAICitabilityBlock() |
| route.ts | AICitabilitySection type, updated AuditResult, compute call, prompt updates |
| SharedAuditView.tsx | AI Citability card \+ sub-signal badges |
| audit.module.css | Bonus section separator, carolina-accented card, badge styles |
| HeroSection.tsx | Updated headline/subhead |
| DiagnosticGrid.tsx | 8th audit item |
| WhatWeCheckSection.tsx | 8th check item |

## Out of Scope (v1)

* Owner vs. customer photo breakdown (requires GMB OAuth — v2)  
* Rolling AI Citability into the overall score  
* Content/SEO article strategy (follow-on)  
  * 

