"use client";

import { useState } from "react";
import styles from "@/styles/audit.module.css";
import type { AuditSection, AICitabilitySection, AuditRow } from "@/lib/types";
import { EmailCopyCard } from "@/app/components/audit/AuditResultParts";

export default function SharedAuditView({ audit }: { audit: AuditRow }) {
  const result = audit.result;
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
          <CopyLinkButton />
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
        {result.top_3_actions.length > 0 && (
          <div className={styles.topActions}>
            <h2 className={styles.topActionsTitle}>Top 3 Priorities</h2>
            <ol className={styles.topActionsList}>
              {result.top_3_actions.map((action, i) => (
                <li key={i} className={styles.topActionItem}>
                  <span className={styles.actionNumber}>{i + 1}</span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* All sections — fully unlocked on shared view */}
        <div className={styles.sectionsGrid}>
          {result.sections.map((section, i) => (
            <SectionCard key={section.id} section={section} index={i} />
          ))}
        </div>

        {/* AI Citability — renders as section 8 via sections.map() above.
            Fallback: older audits that stored it as a separate top-level field. */}
        {result.ai_citability_section &&
          !result.sections?.find((s) => s.id === "ai_citability") && (
            <AICitabilityCard section={result.ai_citability_section} />
          )}

        {/* Email copy — soft opt-in for the shared link viewer */}
        <EmailCopyCard
          businessName={result.business_name}
          auditId={audit.id}
          trade={audit.trade ?? ""}
          city={audit.city ?? ""}
          scoreBucket={result.score_bucket}
          overallScore={result.overall_score}
          lowestSection={
            [...result.sections].sort((a, b) => a.score - b.score)[0]?.id ?? ""
          }
        />

        {/* CTA */}
        <div className={styles.sharedCta}>
          <p className={styles.sharedCtaText}>
            Want results like this for your business?
          </p>
          <a href='/' className={styles.sharedCtaBtn}>
            Run Your Free Audit →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── CopyLinkButton ───────────────────────────────────────────────────────────

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the URL from a temporary input
      const el = document.createElement("input");
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={styles.copyLinkBtn}
      aria-label='Copy shareable link'
    >
      {copied ? "✓ Copied!" : "🔗 Share Results"}
    </button>
  );
}

// ─── ScoreGauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const fill = (score / 10) * circ;
  const gaugeColor =
    score >= 8
      ? "var(--status-green)"
      : score >= 5
        ? "var(--status-yellow)"
        : "var(--status-red)";

  return (
    <div
      className={styles.gauge}
      aria-label={`Overall score: ${score} out of 10 — ${label}`}
    >
      <svg viewBox='0 0 120 120' className={styles.gaugeSvg} aria-hidden='true'>
        <circle
          cx='60'
          cy='60'
          r={r}
          fill='none'
          stroke='currentColor'
          strokeWidth='8'
          className={styles.gaugeTrack}
        />
        <circle
          cx='60'
          cy='60'
          r={r}
          fill='none'
          strokeWidth='8'
          strokeLinecap='round'
          stroke={gaugeColor}
          transform='rotate(-90 60 60)'
          strokeDasharray={`${fill} ${circ}`}
          className={styles.gaugeFill}
        />
      </svg>
      <div className={styles.gaugeLabel}>
        <span className={styles.gaugeScore} style={{ color: gaugeColor }}>
          {score}
        </span>
        <span className={styles.gaugeMax}>/10</span>
        <span className={styles.gaugeOverallLabel}>{label}</span>
      </div>
    </div>
  );
}

// ─── AICitabilityCard ────────────────────────────────────────────────────────

const SUB_SIGNAL_LABELS: Record<string, string> = {
  grounding: "GBP Consistency",
  review_density: "Review Signals",
  photo_freshness: "Photo Activity",
};

const SUB_SIGNAL_STATUS: Record<string, "green" | "yellow" | "red"> = {
  strong: "green",
  partial: "yellow",
  weak: "red",
  unknown: "yellow",
};

function AICitabilityCard({ section }: { section: AICitabilitySection }) {
  return (
    <article className={styles.aiCitabilityCard} data-status={section.status}>
      <div className={styles.cardHead}>
        <span className={styles.sectionScore}>{section.score}</span>
        <div className={styles.cardHeadText}>
          <span className={styles.sectionName}>
            AI Citability &amp; Trust Score
          </span>
          <span className={styles.sectionHeadline}>{section.headline}</span>
        </div>
        <span className={styles.statusDot} aria-label={section.status} />
      </div>
      <div className={styles.cardBody}>
        <p className={styles.finding}>{section.finding}</p>
        <div className={styles.subSignals}>
          {(
            Object.entries(section.sub_signals) as [
              keyof AICitabilitySection["sub_signals"],
              string,
            ][]
          ).map(([key, value]) => (
            <span
              key={key}
              className={styles.subSignalBadge}
              data-status={SUB_SIGNAL_STATUS[value] ?? "yellow"}
            >
              {SUB_SIGNAL_LABELS[key] ?? key}
            </span>
          ))}
        </div>
        {section.priority_action && (
          <div className={styles.priorityAction}>
            <span className={styles.priorityLabel}>Next step: </span>
            <span>{section.priority_action}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function SectionCard({
  section,
  index,
}: {
  section: AuditSection;
  index: number;
}) {
  return (
    <article
      className={styles.sectionCard}
      data-status={section.status}
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className={styles.cardHead}>
        <span className={styles.sectionScore}>{section.score}</span>
        <div className={styles.cardHeadText}>
          <span className={styles.sectionName}>{section.name}</span>
          <span className={styles.sectionHeadline}>{section.headline}</span>
        </div>
        <span className={styles.statusDot} aria-label={section.status} />
      </div>
      <div className={styles.cardBody}>
        <p className={styles.finding}>{section.finding}</p>
        {section.priority_action && (
          <div className={styles.priorityAction}>
            <span className={styles.priorityLabel}>Next step: </span>
            <span>{section.priority_action}</span>
          </div>
        )}
      </div>
    </article>
  );
}
