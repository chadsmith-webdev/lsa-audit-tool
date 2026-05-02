import styles from "@/styles/landing.module.css";

const checks = [
  {
    icon: (
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path d='M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z' />
        <circle cx='12' cy='10' r='3' />
      </svg>
    ),
    name: "Google Business Profile",
    desc: "Is your listing complete, verified, and optimized for your trade and service area?",
  },
  {
    icon: (
      <svg
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
    desc: "How your review count, recency, and rating stack up against competitors in your market.",
  },
  {
    icon: (
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <polyline points='22 12 18 12 15 21 9 3 6 12 2 12' />
      </svg>
    ),
    name: "On-Page SEO",
    desc: "Whether your website is properly targeting local keywords for your trade and city.",
  },
  {
    icon: (
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <rect x='2' y='3' width='20' height='14' rx='2' ry='2' />
        <line x1='8' y1='21' x2='16' y2='21' />
        <line x1='12' y1='17' x2='12' y2='21' />
      </svg>
    ),
    name: "Technical SEO",
    desc: "Page speed, mobile-friendliness, and crawlability — the invisible issues that tank rankings.",
  },
  {
    icon: (
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <circle cx='12' cy='12' r='10' />
        <line x1='2' y1='12' x2='22' y2='12' />
        <path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' />
      </svg>
    ),
    name: "Citations",
    desc: "Consistency of your name, address, and phone across directories — a major local ranking signal.",
  },
  {
    icon: (
      <svg
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
    desc: "The authority signals pointing to your site — and whether they're helping or hurting you.",
  },
  {
    icon: (
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <line x1='18' y1='20' x2='18' y2='10' />
        <line x1='12' y1='20' x2='12' y2='4' />
        <line x1='6' y1='20' x2='6' y2='14' />
      </svg>
    ),
    name: "Competitor Analysis",
    desc: "See the specific businesses outranking you — and understand exactly why they're winning.",
  },
  {
    icon: (
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <circle cx='12' cy='12' r='10' />
        <path d='M12 8v4l3 3' />
      </svg>
    ),
    name: "AI Citability",
    desc: "A bonus score on whether AI search tools — Google's AI Overviews, ChatGPT, Perplexity — can verify and cite your business.",
  },
];

export default function WhatWeCheckSection() {
  return (
    <section className={styles.section} aria-labelledby='what-we-check-title'>
      <p className={styles.sectionLabel}>What the audit covers</p>
      <h2 id='what-we-check-title' className={styles.sectionTitle}>
        8 factors that control whether Google — and AI — shows you
      </h2>
      <p className={styles.sectionBody}>
        Most contractors are invisible for one of these reasons. The audit
        scores all eight — so you know exactly which lever to pull first.
      </p>

      <div className={styles.checksGrid}>
        {checks.map((check) => (
          <div key={check.name} className={styles.checkCard}>
            <span className={styles.checkIcon}>{check.icon}</span>
            <p className={styles.checkName}>{check.name}</p>
            <p className={styles.checkDesc}>{check.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
