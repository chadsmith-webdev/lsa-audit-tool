"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import styles from "@/styles/landing.module.css";

// ─── Data ─────────────────────────────────────────────────────────────────────

const AUDIT_CHECKS = [
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' />
        <circle cx='12' cy='9' r='2.5' />
      </svg>
    ),
    name: "Google Business Profile",
    desc: "The Map Pack Scan. I check if you're showing up where customers look first — and what's keeping you out if you're not.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
      </svg>
    ),
    name: "Reviews",
    desc: "The Trust Check. I look at your review count, recency, rating, and response rate. Silence reads as inactive to both Google and customers.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <circle cx='11' cy='11' r='8' />
        <path d='m21 21-4.35-4.35' />
      </svg>
    ),
    name: "On-Page SEO",
    desc: "I check your title tags, H1s, and service pages for trade- and city-specific targeting. Generic pages don't rank for anything.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
      </svg>
    ),
    name: "Technical SEO",
    desc: "The Technical Map. I check for schema markup gaps and page speed issues that confuse Google and quietly filter you out of local results.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
        <polyline points='14 2 14 8 20 8' />
        <line x1='16' y1='13' x2='8' y2='13' />
        <line x1='16' y1='17' x2='8' y2='17' />
        <polyline points='10 9 9 9 8 9' />
      </svg>
    ),
    name: "Citations",
    desc: "I check your name, address, and phone across Yelp, BBB, Angi, and HomeAdvisor. Inconsistent info causes Google to lose trust in your listing.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
        <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
      </svg>
    ),
    name: "Backlinks",
    desc: "I look at the local and industry signals pointing to your site. These signals tell Google your business is real and active — not a shell with a website.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <circle cx='12' cy='8' r='6' />
        <path d='M15.477 12.89 17 22l-5-3-5 3 1.523-9.11' />
      </svg>
    ),
    name: "Competitors",
    desc: "I find the top 3 businesses ranking above you in the Map Pack right now and show you exactly where the gap is.",
  },
];

// ─── Motion variants ──────────────────────────────────────────────────────────

const list: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiagnosticGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={styles.diagnosticGrid}
      variants={list}
      initial='hidden'
      animate={inView ? "visible" : "hidden"}
    >
      {AUDIT_CHECKS.map((c, i) => (
        <motion.div
          key={c.name}
          className={styles.diagnosticCard}
          variants={card}
        >
          <div className={styles.diagnosticCardHead}>
            <span className={styles.diagnosticIdx} aria-hidden='true'>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={styles.diagnosticIcon}>{c.icon}</span>
          </div>
          <p className={styles.diagnosticName}>{c.name}</p>
          <p className={styles.diagnosticDesc}>{c.desc}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
