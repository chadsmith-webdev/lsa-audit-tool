"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "@/styles/audit.module.css";
import type { AuditSection, AICitabilitySection } from "@/lib/types";
import { cardIn } from "./motionVariants";
import { getSuggestedKeywords } from "@/lib/keywords";

// ─── CopyLinkButton ───────────────────────────────────────────────────────────

export function CopyLinkButton({ auditId }: { auditId: string }) {
  const [copied, setCopied] = useState(false);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://audit.localsearchally.com");

  async function handleCopy() {
    const url = `${siteUrl}/audit/${auditId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={styles.copyLinkBtn}
      aria-label='Copy shareable link'
    >
      {copied ? (
        "✓ Copied!"
      ) : (
        <>
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
            className={styles.copyLinkIcon}
          >
            <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
            <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
          </svg>
          Share Results
        </>
      )}
    </button>
  );
}

// ─── ScoreGauge ───────────────────────────────────────────────────────────────

export function ScoreGauge({ score, label }: { score: number; label: string }) {
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
        {/* Track */}
        <circle
          cx='60'
          cy='60'
          r={r}
          fill='none'
          stroke='currentColor'
          strokeWidth='8'
          className={styles.gaugeTrack}
        />
        {/* Fill — strokeDasharray is runtime SVG geometry */}
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

// ─── SectionCard ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<AuditSection["status"], string> = {
  green: "Strong",
  yellow: "Needs Work",
  red: "Critical",
};

export function SectionCard({
  section,
  index,
  trade = "",
  city = "",
}: {
  section: AuditSection;
  index: number;
  trade?: string;
  city?: string;
}) {
  const num = String(index + 1).padStart(2, "0");
  const barWidth = `${(section.score / 10) * 100}%`;

  return (
    <motion.article
      className={styles.sectionCard}
      data-status={section.status}
      custom={index}
      variants={cardIn}
      initial='hidden'
      animate='visible'
    >
      <div className={styles.cardHead}>
        <span className={styles.sectionNum}>{num}</span>
        <div className={styles.cardHeadText}>
          <span className={styles.sectionName}>{section.name}</span>
          <span className={styles.sectionHeadline}>{section.headline}</span>
        </div>
        <span
          className={styles.statusBadge}
          data-status={section.status}
          aria-label={`Status: ${STATUS_LABELS[section.status]}`}
        >
          {STATUS_LABELS[section.status]}
        </span>
      </div>

      <div className={styles.scoreBarWrap}>
        <div className={styles.scoreTrack} role='presentation'>
          <div
            className={styles.scoreBarFill}
            style={{ width: barWidth } as React.CSSProperties}
          />
        </div>
        <span className={styles.scoreValue}>{section.score}/10</span>
      </div>

      <div className={styles.cardBodyGrid}>
        <div className={styles.findingCol}>
          <span className={styles.colLabel}>Finding</span>
          <p className={styles.finding}>{section.finding}</p>
        </div>
        {section.priority_action && (
          <div className={styles.actionCol}>
            <span className={styles.colLabel}>Recommended Action</span>
            <p className={styles.actionText}>{section.priority_action}</p>
          </div>
        )}
      </div>

      {/* Keyword suggestions + geo-grid next step — onpage section only */}
      {section.id === "onpage" &&
        (() => {
          const keywords = getSuggestedKeywords(trade, city);
          if (!keywords.length) return null;
          const encoded = encodeURIComponent(keywords[0]);
          return (
            <div className={styles.keywordBlock}>
              <span className={`${styles.colLabel} ${styles.keywordLabel}`}>
                Keywords Worth Ranking For
              </span>
              <div className={styles.keywordChips}>
                {keywords.map((kw) => (
                  <span key={kw} className={styles.keywordChip}>
                    {kw}
                  </span>
                ))}
              </div>
              <div className={styles.geoGridCta}>
                <div>
                  <p className={`text-small ${styles.geoGridCtaText}`}>
                    Next Step: See where you actually rank
                  </p>
                  <p className={`text-small ${styles.geoGridCtaSub}`}>
                    Run the geo-grid on any of these keywords to see your map
                    pack position across your service area.
                  </p>
                </div>
                <a
                  href={`/dashboard?keyword=${encoded}`}
                  className={`btn btn-primary btn-sm ${styles.geoGridCtaBtn}`}
                >
                  Open Geo-Grid →
                </a>
              </div>
            </div>
          );
        })()}
    </motion.article>
  );
}

// ─── GroupedSections ──────────────────────────────────────────────────────────
// Splits the flat sections array into 3 thematic groups with eyebrow headers,
// preserving the original index so card numbering (01..08) stays continuous.

const SECTION_CATEGORIES: {
  key: string;
  label: string;
  ids: ReadonlyArray<string>;
}[] = [
  {
    key: "foundation",
    label: "Foundation",
    ids: ["gbp", "reviews", "citations"],
  },
  {
    key: "visibility",
    label: "Visibility",
    ids: ["backlinks", "competitors", "ai_citability"],
  },
  { key: "site-health", label: "Site Health", ids: ["onpage", "technical"] },
];

export function GroupedSections({
  sections,
  trade = "",
  city = "",
}: {
  sections: AuditSection[];
  trade?: string;
  city?: string;
}) {
  const indexed = sections.map((section, index) => ({ section, index }));
  const groups = SECTION_CATEGORIES.map((cat) => ({
    ...cat,
    items: indexed.filter(({ section }) => cat.ids.includes(section.id)),
  })).filter((g) => g.items.length > 0);

  // Catch-all for any unknown section ids so nothing silently disappears.
  const known = new Set(SECTION_CATEGORIES.flatMap((c) => c.ids));
  const unknown = indexed.filter(({ section }) => !known.has(section.id));
  if (unknown.length) {
    groups.push({
      key: "other",
      label: "Other",
      ids: unknown.map((u) => u.section.id),
      items: unknown,
    });
  }

  return (
    <>
      {groups.map((group) => (
        <section key={group.key} className={styles.sectionGroup}>
          <h3 className={styles.sectionGroupEyebrow}>{group.label}</h3>
          <div className={styles.sectionsGrid}>
            {group.items.map(({ section, index }) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                trade={trade}
                city={city}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

// ─── AICitabilityCard ─────────────────────────────────────────────────────────
// Renders the standalone AI Citability section. Used for older audits whose
// payload stored ai_citability_section as a separate top-level field instead
// of inside the `sections` array.

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

export function AICitabilityCard({
  section,
}: {
  section: AICitabilitySection;
}) {
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

// ─── EmailCopyCard ────────────────────────────────────────────────────────────
// NOT a gate. The audit is fully visible above this card. This is a soft
// opt-in that emails the user a copy of the report they just read so they
// can share it with their team or reference it later.

export function EmailCopyCard({
  businessName,
  auditId,
  trade,
  city,
  scoreBucket,
  overallScore,
  lowestSection,
}: {
  businessName: string;
  auditId: string | null;
  trade: string;
  city: string;
  scoreBucket: string;
  overallScore: number;
  lowestSection: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          auditId,
          businessName,
          trade,
          city,
          scoreBucket,
          overallScore,
          lowestSection,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error ??
            "Failed to send. Please try again.",
        );
        setLoading(false);
        return;
      }
    } catch {
      setError("Failed to send. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(false);
    if (
      typeof window !== "undefined" &&
      typeof (window as unknown as { gtag?: unknown }).gtag === "function"
    ) {
      const g = (window as unknown as { gtag: (...args: unknown[]) => void })
        .gtag;
      // Google Ads conversion
      g("event", "conversion", {
        send_to: "AW-18091036166/R9z0CNyoqpwcEIacvbJD",
        value: 1.0,
        currency: "USD",
      });
      // GA4 custom event
      g("event", "email_captured", {
        business_name: businessName,
        trade: trade,
        city: city,
        overall_score: overallScore,
      });
    }
    setSentTo(email);
    setSent(true);
  }

  return (
    <div className={styles.emailCard}>
      <div className={styles.emailCardInner}>
        {sent ? (
          <>
            <h3 className={styles.emailCardTitle}>Sent. Check your inbox.</h3>
            <p className={styles.emailCardSub}>
              A copy of this audit for <strong>{businessName}</strong> is on its
              way to <strong>{sentTo}</strong>. If you don&rsquo;t see it in a
              couple minutes, check your spam folder.
            </p>
          </>
        ) : (
          <>
            <h3 className={styles.emailCardTitle}>
              Want a copy emailed to you?
            </h3>
            <p className={styles.emailCardSub}>
              I&rsquo;ll send a copy of this audit for{" "}
              <strong>{businessName}</strong> so you can share it with your team
              or reference it later.
            </p>
            <form
              onSubmit={handleSubmit}
              className={styles.emailForm}
              noValidate
            >
              <input
                type='email'
                className='form-input'
                placeholder='you@yourcompany.com'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                aria-label='Email address'
                aria-invalid={!!error}
              />
              <button
                type='submit'
                className={styles.emailBtn}
                disabled={loading}
              >
                {loading ? "Sending…" : "Email Me a Copy →"}
              </button>
            </form>
            {error && (
              <span className='form-error' role='alert'>
                {error}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
