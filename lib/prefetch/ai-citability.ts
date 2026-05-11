// ─── AI Citability signals ────────────────────────────────────────────────────

import type { GBPData } from "./gbp";
import type { WebsiteData } from "./website";
import type { ReviewsData } from "./links-reviews";

export interface AICitabilitySignals {
  groundingScore: number; // 0–100 consistency %
  groundingMismatches: string[]; // specific gaps found
  photoFreshnessPulse: "strong" | "weak" | "unknown";
  reviewTexts: string[]; // raw review texts for Claude semantic analysis
}

/** Normalise a phone string to digits only for comparison */
function normalisePhone(raw: string | undefined): string {
  return (raw ?? "").replace(/\D/g, "");
}

/**
 * Extract single-word service keywords from a GBP business name.
 * Strips common stop words and short tokens so we compare meaningful nouns.
 */
function extractServiceKeywords(name: string | undefined): string[] {
  if (!name) return [];
  const stops = new Set([
    "the",
    "and",
    "of",
    "in",
    "at",
    "by",
    "for",
    "a",
    "an",
    "&",
    "llc",
    "inc",
    "co",
    "company",
    "services",
    "service",
    "solutions",
    "group",
    "team",
    "pros",
    "pro",
    "home",
    "local",
  ]);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stops.has(w));
}

/**
 * Pure function — no I/O. Takes already-fetched data and produces structured
 * signals for the AI_CITABILITY pre-fetch block.
 */
export function computeAICitabilitySignals(
  gbp: GBPData,
  website: WebsiteData | null,
  reviews: ReviewsData,
): AICitabilitySignals {
  const mismatches: string[] = [];
  let checksTotal = 0;
  let checksPassed = 0;

  // ── Grounding: phone match ──────────────────────────────────────────────
  if (gbp.found && gbp.phone) {
    checksTotal++;
    const gbpPhone = normalisePhone(gbp.phone);
    const siteText = [
      website?.title ?? "",
      website?.metaDescription ?? "",
      website?.h1 ?? "",
      ...(website?.h2s ?? []),
    ].join(" ");
    const sitePhone = normalisePhone(siteText.match(/[\d\s\-().+]{10,}/)?.[0]);
    if (gbpPhone && sitePhone && gbpPhone === sitePhone) {
      checksPassed++;
    } else if (gbp.found && website) {
      mismatches.push(
        `Phone mismatch: GBP shows ${gbp.phone}, not confirmed on website`,
      );
    }
  }

  // ── Grounding: service keyword presence on website ──────────────────────
  const keywords = extractServiceKeywords(gbp.name);
  if (keywords.length > 0 && website) {
    const webText = [
      website.title ?? "",
      website.h1 ?? "",
      ...(website.h2s ?? []),
    ]
      .join(" ")
      .toLowerCase();

    for (const kw of keywords) {
      checksTotal++;
      if (webText.includes(kw)) {
        checksPassed++;
      } else {
        mismatches.push(
          `Service keyword "${kw}" from GBP name not found in website title/H1/H2s`,
        );
      }
    }
  } else if (keywords.length > 0 && !website) {
    for (const kw of keywords) {
      checksTotal++;
      mismatches.push(`No website to verify GBP keyword "${kw}"`);
    }
  }

  if (checksTotal === 0) {
    mismatches.push(
      "GBP not found and no website — no grounding signals available",
    );
  }

  const groundingScore =
    checksTotal > 0 ? Math.round((checksPassed / checksTotal) * 100) : 0;

  // ── Photo freshness pulse ───────────────────────────────────────────────
  const photoAtCap = gbp.photoAtCap;
  const photoCount = gbp.photoCount ?? 0;
  const photoFreshnessPulse: AICitabilitySignals["photoFreshnessPulse"] =
    !gbp.found
      ? "unknown"
      : photoAtCap || photoCount >= 10
        ? "strong"
        : photoCount < 5
          ? "weak"
          : "unknown";

  // ── Review texts for Claude semantic analysis ───────────────────────────
  const reviewTexts = reviews.reviews.slice(0, 10).map((r) => {
    const parts: string[] = [];
    if (r.rating !== undefined) parts.push(`${r.rating} stars`);
    if (r.date) parts.push(`on ${r.date}`);
    if (r.hasOwnerResponse) parts.push("owner responded");
    return parts.join(", ") || "review (no detail)";
  });

  return {
    groundingScore,
    groundingMismatches: mismatches,
    photoFreshnessPulse,
    reviewTexts,
  };
}

export function formatAICitabilityBlock(
  signals: AICitabilitySignals,
  noWebsite: boolean,
): string {
  const mismatchStr =
    signals.groundingMismatches.length > 0
      ? signals.groundingMismatches.join(" | ")
      : "none detected";

  const reviewSummary =
    signals.reviewTexts.length > 0
      ? signals.reviewTexts.map((r) => `  - ${r}`).join("\n")
      : "  (no reviews available)";

  const noWebsiteNote = noWebsite
    ? "\n  NOTE: No website — grounding score is 0, max section score is 5."
    : "";

  return `AI_CITABILITY:${noWebsiteNote}
  Grounding score: ${signals.groundingScore}% consistency
  Mismatches: ${mismatchStr}
  Photo freshness: ${signals.photoFreshnessPulse}
  Reviews for semantic density analysis (${signals.reviewTexts.length} reviews):
${reviewSummary}`;
}
