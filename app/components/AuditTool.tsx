"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import styles from "@/styles/audit.module.css";
import type { AuditInput, AuditSection, AuditResult } from "@/lib/types";

// ─── Shared motion variants ───────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: "easeIn" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const cardIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.07 },
  }),
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TRADES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Landscaping",
  "Remodeling",
  "General Contracting",
  "Other",
];

const SECTION_ORDER = [
  "gbp",
  "reviews",
  "onpage",
  "technical",
  "citations",
  "backlinks",
  "competitors",
];

// Maps API overall_label values to display names shown in the results card
const SCORE_DISPLAY_LABELS: Record<AuditResult["overall_label"], string> = {
  Critical: "Digital Ghost",
  "Needs Work": "Local Mirage",
  Solid: "Visible Contender",
  Strong: "Local Authority",
};

const SECTION_LABELS: Record<string, string> = {
  gbp: "Google Business Profile",
  reviews: "Reviews",
  onpage: "On-Page SEO",
  technical: "Technical SEO",
  citations: "Citations",
  backlinks: "Backlinks",
  competitors: "Competitors",
};

// ─── Main Orchestrator ────────────────────────────────────────────────────────

type Phase = "form" | "loading" | "results";

export default function AuditTool() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<AuditInput>(() => {
    const business = searchParams?.get("business") ?? "";
    const city = searchParams?.get("city") ?? "";
    const trade = searchParams?.get("trade") ?? "";
    const validTrade = TRADES.includes(trade) ? trade : "";
    return {
      businessName: business.slice(0, 100),
      websiteUrl: "",
      primaryTrade: validTrade,
      serviceCity: city.slice(0, 100),
      noWebsite: false,
    };
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof AuditInput, string>>
  >({});
  const [auditError, setAuditError] = useState<string | null>(null);
  const [doneSections, setDoneSections] = useState<string[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    SECTION_ORDER[0],
  );
  const [result, setResult] = useState<AuditResult | null>(null);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Connecting…");

  function validate(): boolean {
    const e: Partial<Record<keyof AuditInput, string>> = {};
    if (!form.businessName || form.businessName.trim().length < 2)
      e.businessName = "Business name required (min 2 characters)";

    if (!form.primaryTrade) e.primaryTrade = "Select a trade";
    if (!form.serviceCity || form.serviceCity.trim().length < 2)
      e.serviceCity = "Service city required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    let input = { ...form };
    if (input.websiteUrl && !/^https?:\/\//.test(input.websiteUrl)) {
      input.websiteUrl = "https://" + input.websiteUrl;
    }

    setPhase("loading");
    setDoneSections([]);
    setActiveSectionId(SECTION_ORDER[0]);
    setAuditError(null);
    setStatusMessage("Connecting…");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            "You've already run a free audit this month. Come back in 30 days.",
        );
      }

      if (!response.ok || !response.body) {
        throw new Error(
          "Failed to connect to audit service. Please try again.",
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.trim().split("\n");
          let eventType = "";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: ")) dataStr = line.slice(6);
          }
          if (!dataStr) continue;

          let data: unknown;
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue;
          }

          if (eventType === "section") {
            setStatusMessage("Scoring your results…");
            const id = (data as AuditSection).id;
            setDoneSections((prev) => [...prev, id]);
            const idx = SECTION_ORDER.indexOf(id);
            if (idx >= 0 && idx < SECTION_ORDER.length - 1) {
              setActiveSectionId(SECTION_ORDER[idx + 1]);
            }
          } else if (eventType === "complete") {
            const auditResult = data as AuditResult;
            setResult(auditResult);
            setPhase("results");

            // GA4 Custom Event: audit_complete
            if (
              typeof window !== "undefined" &&
              typeof (window as unknown as { gtag?: unknown }).gtag ===
                "function"
            ) {
              (
                window as unknown as { gtag: (...args: unknown[]) => void }
              ).gtag("event", "audit_complete", {
                business_name: auditResult.business_name,
                overall_score: auditResult.overall_score,
                score_bucket: auditResult.score_bucket,
              });
            }
          } else if (eventType === "status") {
            setStatusMessage((data as { message: string }).message);
          } else if (eventType === "error") {
            setAuditError(
              (data as { message?: string }).message ?? "Something went wrong",
            );
            setPhase("form");
          }
        }
      }
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const message = isAbort
        ? "The audit took too long — try again, it usually completes."
        : err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setAuditError(message);
      setPhase("form");
      return;
    }
    clearTimeout(timer);
  }

  if (phase === "form") {
    return (
      <AuditForm
        form={form}
        errors={errors}
        auditError={auditError}
        onChange={(k, v) => {
          setForm((f) => ({ ...f, [k]: v }));
          if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
        }}
        onSubmit={handleSubmit}
      />
    );
  }

  if (phase === "loading") {
    return (
      <AuditLoading
        businessName={form.businessName}
        doneSections={doneSections}
        activeSectionId={activeSectionId}
        statusMessage={statusMessage}
      />
    );
  }

  if (phase === "results" && result) {
    return (
      <AuditResults
        result={result}
        input={form}
        emailSubmitted={emailSubmitted}
        onEmailSubmit={() => setEmailSubmitted(true)}
        onRunAgain={() => {
          setPhase("form");
          setResult(null);
          setDoneSections([]);
          setEmailSubmitted(false);
        }}
      />
    );
  }

  return null;
}

// ─── AuditForm ────────────────────────────────────────────────────────────────

function AuditForm({
  form,
  errors,
  auditError,
  onChange,
  onSubmit,
}: {
  form: AuditInput;
  errors: Partial<Record<keyof AuditInput, string>>;
  auditError: string | null;
  onChange: (k: keyof AuditInput, v: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <motion.div
      className={styles.formWrap}
      variants={fadeUp}
      initial='hidden'
      animate='visible'
    >
      <div className={styles.formCard}>
        <form onSubmit={onSubmit} noValidate className={styles.form}>
          {/* Field order: Business Name → Trade → City → Website
              Progressive commitment: start easy, increase effort gradually */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor='businessName'>
              Business Name
            </label>
            <input
              id='businessName'
              type='text'
              className={styles.input}
              placeholder='Rogers HVAC Pro'
              value={form.businessName}
              onChange={(e) => onChange("businessName", e.target.value)}
              aria-invalid={!!errors.businessName}
            />
            {errors.businessName && (
              <span className={styles.fieldError}>{errors.businessName}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor='primaryTrade'>
              Primary Trade
            </label>
            <select
              id='primaryTrade'
              className={styles.select}
              value={form.primaryTrade}
              onChange={(e) => onChange("primaryTrade", e.target.value)}
              aria-invalid={!!errors.primaryTrade}
            >
              <option value=''>Select trade…</option>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.primaryTrade && (
              <span className={styles.fieldError}>{errors.primaryTrade}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor='serviceCity'>
              Service City
            </label>
            <input
              id='serviceCity'
              type='text'
              className={styles.input}
              placeholder='Rogers, AR'
              value={form.serviceCity}
              onChange={(e) => onChange("serviceCity", e.target.value)}
              aria-invalid={!!errors.serviceCity}
            />
            {errors.serviceCity && (
              <span className={styles.fieldError}>{errors.serviceCity}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor='websiteUrl'>
              Website <span className={styles.labelOptional}>(optional)</span>
            </label>
            <input
              id='websiteUrl'
              type='url'
              className={styles.input}
              placeholder='rogershvacpro.com'
              value={form.websiteUrl}
              onChange={(e) => onChange("websiteUrl", e.target.value)}
              aria-invalid={!!errors.websiteUrl}
            />
            {errors.websiteUrl && (
              <span className={styles.fieldError}>{errors.websiteUrl}</span>
            )}
          </div>

          {auditError && (
            <p className={styles.auditError} role='alert'>
              {auditError}
            </p>
          )}

          <button type='submit' className={styles.submitBtn}>
            Run My Free Audit →
          </button>
          <p className={styles.formTrust}>
            Checks your actual Google listing, reviews, and citations — not
            estimates. Built by Chad Smith, NWA local SEO specialist.
          </p>
        </form>
      </div>
    </motion.div>
  );
}

// ─── AuditLoading ─────────────────────────────────────────────────────────────

function AuditLoading({
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

// ─── AuditResults ─────────────────────────────────────────────────────────────

function AuditResults({
  result,
  input,
  emailSubmitted,
  onEmailSubmit,
  onRunAgain,
}: {
  result: AuditResult;
  input: AuditInput;
  emailSubmitted: boolean;
  onEmailSubmit: () => void;
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
            />
          ))}
        </div>

        {/* Email gate */}
        {!emailSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.45, ease: "easeOut" }}
          >
            <EmailGate
              businessName={result.business_name}
              auditId={result.auditId ?? null}
              trade={input.primaryTrade}
              city={input.serviceCity}
              scoreBucket={result.score_bucket}
              overallScore={result.overall_score}
              competitorNames={result.competitor_names}
              lowestSection={
                [...result.sections].sort((a, b) => a.score - b.score)[0]?.id ??
                ""
              }
              onSubmit={onEmailSubmit}
            />
          </motion.div>
        )}

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

// ─── CopyLinkButton ───────────────────────────────────────────────────────────

function CopyLinkButton({ auditId }: { auditId: string }) {
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

function SectionCard({
  section,
  index,
}: {
  section: AuditSection;
  index: number;
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
    </motion.article>
  );
}

// ─── EmailGate ────────────────────────────────────────────────────────────────

function EmailGate({
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
            className={styles.emailInput}
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
          <span className={styles.emailError} role='alert'>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
