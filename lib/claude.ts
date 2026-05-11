// lib/claude.ts — Anthropic API call wrapper for audit generation

import {
  SYSTEM_PROMPT,
  buildAuditPrompt,
  parseAuditResult,
} from "@/lib/audit-helpers";
import type {
  AICitabilitySignals,
  BacklinksData,
  GBPData,
  PageSpeedData,
  ReviewsData,
  SerperData,
  WebsiteData,
} from "@/lib/prefetch";
import type { AuditInput, AuditResult } from "@/lib/types";

type PrefetchBundle = {
  gbp: GBPData;
  pagespeed: PageSpeedData;
  serper: SerperData;
  website: WebsiteData | null;
  backlinks: BacklinksData | null;
  reviews: ReviewsData;
  failedBlocks?: Set<string>;
  aiCitabilitySignals?: AICitabilitySignals;
};

export async function callClaude(
  input: AuditInput,
  prefetch: PrefetchBundle,
  signal: AbortSignal,
): Promise<AuditResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  async function attempt(prompt: string): Promise<AuditResult> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        system: SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        temperature: 0.2,
      }),
      signal,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${details}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const textBlocks = (data.content ?? []).filter((b) => b.type === "text");
    const textBlock = textBlocks[textBlocks.length - 1];
    if (!textBlock || !textBlock.text) {
      throw new Error("No text block in Anthropic response");
    }
    return parseAuditResult(textBlock.text);
  }

  try {
    return await attempt(buildAuditPrompt(input, prefetch));
  } catch (err) {
    if (err instanceof SyntaxError) {
      return await attempt(
        buildAuditPrompt(input, prefetch) +
          "\n\nReturn ONLY JSON, no other text.",
      );
    }
    throw err;
  }
}
