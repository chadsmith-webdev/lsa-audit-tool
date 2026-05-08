"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "@/styles/audit.module.css";
import type { AuditSection } from "@/lib/types";
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
            style={{
              display: "inline",
              verticalAlign: "middle",
              marginRight: 6,
            }}
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
      {section.id === "onpage" && (() => {
        const keywords = getSuggestedKeywords(trade, city);
        if (!keywords.length) return null;
        const encoded = encodeURIComponent(keywords[0]);
        return (
          <div style={{
            marginTop: "var(--space-5)",
            paddingTop: "var(--space-5)",
            borderTop: "1px solid var(--surface2)",
          }}>
            <span className={styles.colLabel} style={{ display: "block", marginBottom: "var(--space-3)" }}>
              Keywords Worth Ranking For
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              {keywords.map((kw) => (
                <span
                  key={kw}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--surface2)",
                    color: "var(--muted)",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
            <div style={{
              padding: "var(--space-4)",
              background: "rgba(123,175,212,0.06)",
              border: "1px solid rgba(123,175,212,0.18)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "var(--space-3)",
            }}>
              <div>
                <p className="text-small" style={{ color: "var(--text)", marginBottom: "2px", fontWeight: 600 }}>
                  Next Step: See where you actually rank
                </p>
                <p className="text-small" style={{ color: "var(--muted)" }}>
                  Run the geo-grid on any of these keywords to see your map pack position across your service area.
                </p>
              </div>
              <a
                href={`/dashboard?keyword=${encoded}`}
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: "nowrap", flexShrink: 0 }}
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

// ─── EmailGate ────────────────────────────────────────────────────────────────

export function EmailGate({
  businessName,
  auditId,
  trade,
  city,
  scoreBucket,
  overallScore,
  competitorNames,
  lowestSection,
  onSubmit,
}: {
  businessName: string;
  auditId: string | null;
  trade: string;
  city: string;
  scoreBucket: string;
  overallScore: number;
  competitorNames: string[];
  lowestSection: string;
  onSubmit: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    const params = new URLSearchParams();
    if (auditId) params.set("auditId", auditId);
    const qs = params.has("auditId") ? `?${params.toString()}` : "";
    window.location.href = `/thank-you${qs}`;
  }

  return (
    <div className={styles.emailGate}>
      <div className={styles.emailGateInner}>
        <h3 className={styles.emailGateTitle}>Want a copy to keep?</h3>
        <p className={styles.emailGateSub}>
          I&rsquo;ll email you the full report for{" "}
          <strong>{businessName}</strong> — every finding, your{" "}
          <strong>{overallScore}/10</strong> score breakdown, and the priority
          action list
          {competitorNames.length > 0
            ? ` including the gaps ${competitorNames.slice(0, 2).join(" and ")} are using to outrank you`
            : ""}
          . No fluff, just the audit.
        </p>
        <form onSubmit={handleSubmit} className={styles.emailForm} noValidate>
          <input
            type='email'
            className="form-input"
            placeholder='you@yourcompany.com'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            aria-label='Email address'
            aria-invalid={!!error}
          />
          <button type='submit' className={styles.emailBtn} disabled={loading}>
            {loading ? "Sending…" : "Email Me the Report →"}
          </button>
        </form>
        {error && (
          <span className="form-error" role='alert'>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
