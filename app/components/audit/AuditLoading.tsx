"use client";

import { motion, AnimatePresence } from "framer-motion";
import styles from "@/styles/audit.module.css";
import { SECTION_LABELS } from "@/lib/types";
import { fadeUp } from "./motionVariants";

const SECTION_ORDER = [
  "gbp",
  "reviews",
  "onpage",
  "technical",
  "citations",
  "backlinks",
  "competitors",
];

export function AuditLoading({
  businessName,
  doneSections,
  activeSectionId,
  statusMessage,
}: {
  businessName: string;
  doneSections: string[];
  activeSectionId: string;
  statusMessage: string;
}) {
  return (
    <motion.div
      className={`flex flex-1 flex-col items-center justify-center px-4 ${styles.loadingWrap}`}
      variants={fadeUp}
      initial='hidden'
      animate='visible'
    >
      <div className={styles.loadingCard}>
        <p className={styles.loadingEyebrow}>Running reconnaissance on</p>
        <h2 className={styles.loadingTitle}>{businessName}</h2>
        <p className={styles.loadingStatus} aria-live='polite'>{statusMessage}</p>
        <ul className={styles.sectionList} aria-label='Audit progress'>
          {SECTION_ORDER.map((id) => {
            const done = doneSections.includes(id);
            const active = !done && id === activeSectionId;
            return (
              <motion.li
                key={id}
                className={styles.sectionChip}
                data-done={done ? "true" : undefined}
                data-active={active ? "true" : undefined}
                aria-label={`${SECTION_LABELS[id]}: ${done ? "complete" : active ? "checking" : "pending"}`}
                animate={{
                  opacity: done ? 1 : active ? 1 : 0.4,
                  x: active ? [0, 3, 0] : 0,
                }}
                transition={{
                  opacity: { duration: 0.3 },
                  x: {
                    duration: 0.6,
                    repeat: active ? Infinity : 0,
                    ease: "easeInOut",
                  },
                }}
              >
                <AnimatePresence mode='wait'>
                  <motion.span
                    key={done ? "done" : "pending"}
                    className={styles.chipIndicator}
                    aria-hidden='true'
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {done ? "✓" : "·"}
                  </motion.span>
                </AnimatePresence>
                <span className={styles.chipLabel}>{SECTION_LABELS[id]}</span>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}
