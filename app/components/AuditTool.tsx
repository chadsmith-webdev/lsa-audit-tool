"use client";

import { useState } from "react";
import styles from "@/styles/audit.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditInput = {
  businessName: string;
  websiteUrl: string;
  primaryTrade: string;
  serviceCity: string;
  noWebsite: boolean;
};

type AuditSection = {
  id: string;
  name: string;
  score: number;
  status: "green" | "yellow" | "red";
  headline: string;
  finding: string;
  priority_action: string;
};

type AuditResult = {
  business_name: string;
  overall_score: number;
  overall_label: "Strong" | "Solid" | "Needs Work" | "Critical";
  summary: string;
  has_website: boolean;
  score_bucket: "Critical" | "Needs Work" | "Solid" | "Strong";
  sections: AuditSection[];
  top_3_actions: string[];
  competitor_names: string[];
  auditId?: string | null;
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
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<AuditInput>({
    businessName: "",
    websiteUrl: "",
    primaryTrade: "",
    serviceCity: "",
    noWebsite: false,
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

  function validate(): boolean {
    const e: Partial<Record<keyof AuditInput, string>> = {};
    if (!form.businessName || form.businessName.trim().length < 2)
      e.businessName = "Business name required (min 2 characters)";
    if (
      !form.noWebsite &&
      (!form.websiteUrl || form.websiteUrl.trim().length < 3)
    )
      e.websiteUrl = "Website URL is required";
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
    if (
      !input.noWebsite &&
      input.websiteUrl &&
      !/^https?:\/\//.test(input.websiteUrl)
    ) {
      input.websiteUrl = "https://" + input.websiteUrl;
    }

    setPhase("loading");
    setDoneSections([]);
    setActiveSectionId(SECTION_ORDER[0]);
    setAuditError(null);

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
            "You've run 5 audits today. Come back tomorrow for another free audit.",
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
            const id = (data as AuditSection).id;
            setDoneSections((prev) => [...prev, id]);
            const idx = SECTION_ORDER.indexOf(id);
            if (idx >= 0 && idx < SECTION_ORDER.length - 1) {
              setActiveSectionId(SECTION_ORDER[idx + 1]);
            }
          } else if (eventType === "complete") {
            setResult(data as AuditResult);
            setPhase("results");
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
    <div
      className={`flex flex-1 flex-col items-center justify-center px-4 py-16 ${styles.formWrap}`}
    >
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <span className={styles.eyebrow}>Free Local SEO Audit</span>
          <h1 className={styles.formTitle}>
            See exactly how your business
            <br />
            shows up in Google
          </h1>
          <p className={styles.formSub}>
            Real audit. Real data. 60–90 seconds.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className={styles.form}>
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
            <div className={styles.checkboxRow}>
              <input
                id='noWebsite'
                type='checkbox'
                className={styles.checkbox}
                checked={form.noWebsite}
                onChange={(e) => onChange("noWebsite", e.target.checked)}
              />
              <label htmlFor='noWebsite' className={styles.checkboxLabel}>
                No website yet
              </label>
            </div>

            {form.noWebsite ? (
              <p className={styles.noWebsiteNotice}>
                No website = invisible in Google search. We&rsquo;ll show you
                what to do about it.
              </p>
            ) : (
              <>
                <input
                  id='websiteUrl'
                  type='url'
                  className={styles.input}
                  placeholder='rogershvacpro.com'
                  value={form.websiteUrl}
                  onChange={(e) => onChange("websiteUrl", e.target.value)}
                  aria-invalid={!!errors.websiteUrl}
                  aria-label='Website URL'
                />
                {errors.websiteUrl && (
                  <span className={styles.fieldError}>{errors.websiteUrl}</span>
                )}
              </>
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
        </form>
      </div>
    </div>
  );
}

// ─── AuditLoading ─────────────────────────────────────────────────────────────

function AuditLoading({
  businessName,
  doneSections,
  activeSectionId,
}: {
  businessName: string;
  doneSections: string[];
  activeSectionId: string;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center px-4 ${styles.loadingWrap}`}
    >
      <div className={styles.loadingCard}>
        <p className={styles.loadingEyebrow}>Running audit for</p>
        <h2 className={styles.loadingTitle}>{businessName}</h2>
        <ul className={styles.sectionList} aria-label='Audit progress'>
          {SECTION_ORDER.map((id) => {
            const done = doneSections.includes(id);
            const active = !done && id === activeSectionId;
            return (
              <li
                key={id}
                className={styles.sectionChip}
                data-done={done ? "true" : undefined}
                data-active={active ? "true" : undefined}
                aria-label={`${SECTION_LABELS[id]}: ${done ? "complete" : active ? "checking" : "pending"}`}
              >
                <span className={styles.chipIndicator} aria-hidden='true'>
                  {done ? "✓" : "·"}
                </span>
                <span className={styles.chipLabel}>{SECTION_LABELS[id]}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
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
    <div className={styles.resultsWrap}>
      <div className={styles.resultsInner}>
        {/* Share button */}
        {result.auditId && (
          <div className={styles.shareRow}>
            <CopyLinkButton auditId={result.auditId} />
          </div>
        )}

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

        {/* Section cards */}
        <div className={styles.sectionsGrid}>
          {result.sections.map((section, i) => (
            <SectionCard
              key={section.id}
              section={section}
              index={i}
              locked={i >= 4 && !emailSubmitted}
            />
          ))}
        </div>

        {/* Email gate */}
        {!emailSubmitted && (
          <EmailGate
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
            onSubmit={onEmailSubmit}
          />
        )}

        {/* Re-audit footer */}
        <div className={styles.reauditCard}>
          <p className={styles.reauditText}>
            Run this again in 30 days to track your progress.
          </p>
          <button onClick={onRunAgain} className={styles.reauditBtn}>
            Audit Another Business
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CopyLinkButton ───────────────────────────────────────────────────────────

function CopyLinkButton({ auditId }: { auditId: string }) {
  const [copied, setCopied] = useState(false);
  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://localsearchally.com";

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

function SectionCard({
  section,
  index,
  locked,
}: {
  section: AuditSection;
  index: number;
  locked: boolean;
}) {
  return (
    <article
      className={styles.sectionCard}
      data-status={section.status}
      data-locked={locked ? "true" : undefined}
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
      <div className={locked ? styles.cardBodyLocked : styles.cardBody}>
        <p className={styles.finding}>{section.finding}</p>
        {section.priority_action && (
          <div className={styles.priorityAction}>
            <span className={styles.priorityLabel}>Next step:</span>
            <span>{section.priority_action}</span>
          </div>
        )}
      </div>
    </article>
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
  lowestSection,
  onSubmit,
}: {
  businessName: string;
  auditId: string | null;
  trade: string;
  city: string;
  scoreBucket: string;
  overallScore: number;
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
    onSubmit();
  }

  return (
    <div className={styles.emailGate}>
      <div className={styles.emailGateInner}>
        <span className={styles.lockIcon} aria-hidden='true'>
          🔒
        </span>
        <h3 className={styles.emailGateTitle}>
          Your full action plan — ranked by impact — is ready.
        </h3>
        <p className={styles.emailGateSub}>
          Enter your email to unlock the complete audit for{" "}
          <strong>{businessName}</strong> — including citations, backlinks, and
          competitor gaps.
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
            {loading ? "Sending…" : "Send It →"}
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
