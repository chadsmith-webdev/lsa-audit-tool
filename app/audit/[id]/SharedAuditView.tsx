"use client";

import styles from "@/styles/audit.module.css";
import type { AuditRow } from "@/lib/types";
import {
  AICitabilityCard,
  CopyLinkButton,
  GroupedSections,
  ScoreGauge,
  TopActions,
} from "@/app/components/audit/AuditResultParts";

export default function SharedAuditView({ audit }: { audit: AuditRow }) {
  const result = audit.result;
  const trade = audit.trade ?? "";
  const city = audit.city ?? "";
  const createdAt = new Date(audit.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={styles.resultsWrap}>
      <div className={styles.resultsInner}>
        {/* Shared badge */}
        <div className={styles.sharedBadge}>
          <span>Audit from {createdAt}</span>
          <CopyLinkButton auditId={audit.id} />
        </div>

        {/* Score header */}
        <div className={styles.scoreHeader}>
          <ScoreGauge
            score={result.overall_score}
            label={result.overall_label}
          />
          <div className={styles.scoreMeta}>
            <h1 className={styles.resultsTitle}>{result.business_name}</h1>
            <p className={styles.summary}>{result.summary}</p>
            {result.competitor_names.length > 0 && (
              <p className={styles.competitors}>
                <span className={styles.competitorsLabel}>
                  Competing against:
                </span>{" "}
                {result.competitor_names.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Top 3 actions */}
        <TopActions actions={result.top_3_actions} sections={result.sections} />

        {/* All sections — fully unlocked on shared view, grouped by category */}
        <GroupedSections sections={result.sections} trade={trade} city={city} />

        {/* AI Citability — renders as section 8 via sections.map() above.
            Fallback: older audits that stored it as a separate top-level field. */}
        {result.ai_citability_section &&
          !result.sections?.find((s) => s.id === "ai_citability") && (
            <AICitabilityCard section={result.ai_citability_section} />
          )}

        {/* CTA */}
        <div className={styles.sharedCta}>
          <p className={styles.sharedCtaText}>
            Want results like this for your business?
          </p>
          <a href='/' className='btn btn-primary'>
            Run Your Free Audit →
          </a>
        </div>
      </div>
    </div>
  );
}
