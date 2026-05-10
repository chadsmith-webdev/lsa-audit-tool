"use client";

import { motion } from "framer-motion";
import styles from "@/styles/audit.module.css";
import type { AuditInput, AuditResult } from "@/lib/types";
import { fadeUp, stagger } from "./motionVariants";
import {
  CopyLinkButton,
  ScoreGauge,
  SectionCard,
  EmailCopyCard,
} from "./AuditResultParts";

// Maps API overall_label values to display names shown in the results card
const SCORE_DISPLAY_LABELS: Record<AuditResult["overall_label"], string> = {
  Critical: "Digital Ghost",
  "Needs Work": "Local Mirage",
  Solid: "Visible Contender",
  Strong: "Local Authority",
};

export function AuditResults({
  result,
  input,
  onRunAgain,
}: {
  result: AuditResult;
  input: AuditInput;
  onRunAgain: () => void;
}) {
  return (
    <motion.div
      className={styles.resultsWrap}
      variants={fadeUp}
      initial='hidden'
      animate='visible'
    >
      <div className={styles.resultsInner}>
        {/* Share button */}
        {result.auditId && (
          <motion.div
            className={styles.shareRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <CopyLinkButton auditId={result.auditId} />
          </motion.div>
        )}

        {/* Score header */}
        <motion.div
          className={styles.scoreHeader}
          variants={stagger}
          initial='hidden'
          animate='visible'
        >
          <ScoreGauge
            score={result.overall_score}
            label={SCORE_DISPLAY_LABELS[result.overall_label]}
          />
          <motion.div className={styles.scoreMeta} variants={stagger}>
            <motion.h1 variants={fadeUp} className={styles.resultsTitle}>
              {result.business_name}
            </motion.h1>
            <motion.p variants={fadeUp} className={styles.summary}>
              {result.summary}
            </motion.p>
            {result.competitor_names.length > 0 && (
              <motion.p variants={fadeUp} className={styles.competitors}>
                <span className={styles.competitorsLabel}>
                  Outranking you right now:
                </span>{" "}
                {result.competitor_names.join(", ")}
              </motion.p>
            )}
          </motion.div>
        </motion.div>

        {/* Top 3 actions */}
        {result.top_3_actions.length > 0 && (
          <div className={styles.topActions}>
            <h2 className={styles.topActionsTitle}>Top 3 High-Impact Fixes</h2>
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

        {/* Section cards */}
        <div className={styles.sectionsGrid}>
          {result.sections.map((section, i) => (
            <SectionCard
              key={section.id}
              section={section}
              index={i}
              trade={input.primaryTrade}
              city={input.serviceCity}
            />
          ))}
        </div>

        {/* Email copy — soft opt-in, not a gate */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45, ease: "easeOut" }}
        >
          <EmailCopyCard
            businessName={result.business_name}
            auditId={result.auditId ?? null}
            trade={input.primaryTrade}
            city={input.serviceCity}
            scoreBucket={result.score_bucket}
            overallScore={result.overall_score}
            lowestSection={
              [...result.sections].sort((a, b) => a.score - b.score)[0]?.id ??
              ""
            }
          />
        </motion.div>

        {/* Re-audit footer */}
        <motion.div
          className={styles.reauditCard}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <p className={styles.reauditText}>
            Run this again in 30 days to track your progress.
          </p>
          <button onClick={onRunAgain} className={styles.reauditBtn}>
            Start a New Audit
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
