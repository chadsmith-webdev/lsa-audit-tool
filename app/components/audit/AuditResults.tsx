"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "@/styles/audit.module.css";
import { track } from "@/lib/analytics";
import type { AuditInput, AuditResult } from "@/lib/types";
import { fadeUp, stagger } from "./motionVariants";
import { createBrowserClient } from "@/lib/supabase";
import {
  CopyLinkButton,
  ScoreGauge,
  GroupedSections,
  TopActions,
  SaveAndMonitorCard,
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
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) setIsAuthed(!!user);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <TopActions actions={result.top_3_actions} sections={result.sections} />

        {/* Section cards, grouped by category */}
        <GroupedSections
          sections={result.sections}
          trade={input.primaryTrade}
          city={input.serviceCity}
        />

        {/* Save & Monitor — single conversion CTA. Auth-aware:
            anonymous → magic-link signup, signed-in → link to dashboard. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45, ease: "easeOut" }}
        >
          <SaveAndMonitorCard
            auditId={result.auditId ?? null}
            businessName={result.business_name}
          />
        </motion.div>

        {/* Done-for-you upsell */}
        <motion.div
          className={styles.dfyCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.45, ease: "easeOut" }}
        >
          <div className={styles.dfyInner}>
            <div className={styles.dfyText}>
              <p className={styles.dfyHeading}>
                Rather have someone fix this for you?
              </p>
              <p className={styles.dfySub}>
                I work with NWA home service trades directly — no contracts, no
                hand-offs to a team you&apos;ve never met. Starting at $497/month.
              </p>
            </div>
            <a
              href="https://localsearchally.com/contact?utm_source=audit-tool&utm_medium=results-cta&utm_campaign=dfy-upsell"
              className={styles.dfyBtn}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("upgrade_clicked", { plan: "dfy", source: "audit-results" })}
            >
              Book a Free Call →
            </a>
          </div>
        </motion.div>

        {/* Re-audit footer */}
        <motion.div
          className={styles.reauditCard}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <p className={styles.reauditText}>
            Want to test a different business or location?
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {isAuthed && (
              <a href='/dashboard' className='btn btn-secondary btn-sm'>
                ← Back to Dashboard
              </a>
            )}
            <button onClick={onRunAgain} className='btn btn-secondary btn-sm'>
              Run Another Audit
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
