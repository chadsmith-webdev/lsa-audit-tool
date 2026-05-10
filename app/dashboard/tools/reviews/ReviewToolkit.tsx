"use client";

import { useState } from "react";

type Mode = "reply" | "request";
type Channel = "sms" | "email" | "post_job" | "in_person";
type Variant = { label: string; text: string; subject?: string };

const CHANNELS: { value: Channel; label: string; hint: string }[] = [
  { value: "sms", label: "SMS", hint: "Best response rate" },
  { value: "email", label: "Email", hint: "With subject lines" },
  { value: "post_job", label: "Post-job", hint: "Same-day follow-up" },
  { value: "in_person", label: "In-person card", hint: "Leave-behind" },
];

const STAR = "★";

export default function ReviewToolkit({ auditId }: { auditId: string }) {
  const [mode, setMode] = useState<Mode>("reply");

  return (
    <section
      className='card card-default'
      style={{
        padding: "var(--space-6)",
        marginTop: "var(--space-6)",
      }}
    >
      <header style={{ marginBottom: "var(--space-4)" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--carolina)",
            marginBottom: "var(--space-2)",
          }}
        >
          Review Toolkit
        </span>
        <h2 className='heading-3' style={{ marginBottom: "var(--space-2)" }}>
          Reply to reviews & ask for new ones
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          Drafts that read human, follow Google&rsquo;s 2026 review policies,
          and stay clear of phrases the spam filter flags.
        </p>
      </header>

      <div
        role='tablist'
        aria-label='Review mode'
        style={{
          display: "inline-flex",
          padding: "4px",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-5)",
          gap: "2px",
        }}
      >
        {(["reply", "request"] as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              role='tab'
              type='button'
              aria-selected={active}
              onClick={() => setMode(m)}
              style={{
                padding: "var(--space-2) var(--space-4)",
                background: active ? "var(--carolina)" : "transparent",
                color: active ? "#fff" : "var(--text)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {m === "reply" ? "Reply to a review" : "Ask for reviews"}
            </button>
          );
        })}
      </div>

      {mode === "reply" ? (
        <ReplyPanel auditId={auditId} />
      ) : (
        <RequestPanel auditId={auditId} />
      )}
    </section>
  );
}

/* ----------------------------- REPLY PANEL ----------------------------- */

function ReplyPanel({ auditId }: { auditId: string }) {
  const [rating, setRating] = useState(5);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function handleGenerate() {
    if (!reviewText.trim()) {
      setError("Paste the review text first.");
      return;
    }
    setLoading(true);
    setError(null);
    setVariants(null);
    setCopiedIdx(null);
    try {
      const res = await fetch("/api/tools/gbp/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          mode: "reply",
          rating,
          reviewerName,
          reviewText,
        }),
      });
      const data = (await res.json()) as {
        variants?: Variant[];
        error?: string;
      };
      if (!res.ok || !data.variants)
        throw new Error(data.error ?? "Generation failed");
      setVariants(data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(idx: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <span
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "var(--space-2)",
          }}
        >
          Star rating
        </span>
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= rating;
            return (
              <button
                key={n}
                type='button'
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                style={{
                  width: "36px",
                  height: "36px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "24px",
                  color: filled ? "var(--status-yellow)" : "var(--border)",
                  transition: "color 0.1s ease",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                {STAR}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div>
          <label htmlFor='reviewer' style={fieldLabel}>
            Reviewer name{" "}
            <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>
              (optional)
            </span>
          </label>
          <input
            id='reviewer'
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder='e.g. Sarah'
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor='review-text' style={fieldLabel}>
            Review text
          </label>
          <textarea
            id='review-text'
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder='Paste the review the customer left.'
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      </div>

      <button
        type='button'
        onClick={handleGenerate}
        disabled={loading}
        className='btn btn-primary'
      >
        {loading ? "Generating…" : variants ? "Regenerate" : "Generate replies"}
      </button>

      {error && <p style={errorStyle}>{error}</p>}

      {variants && (
        <VariantList
          variants={variants}
          copiedIdx={copiedIdx}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}

/* ---------------------------- REQUEST PANEL ---------------------------- */

function RequestPanel({ auditId }: { auditId: string }) {
  const [channel, setChannel] = useState<Channel>("sms");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setVariants(null);
    setCopiedIdx(null);
    try {
      const res = await fetch("/api/tools/gbp/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, mode: "request", channel }),
      });
      const data = (await res.json()) as {
        variants?: Variant[];
        error?: string;
      };
      if (!res.ok || !data.variants)
        throw new Error(data.error ?? "Generation failed");
      setVariants(data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(idx: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <span style={fieldLabel}>Channel</span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "var(--space-2)",
          }}
        >
          {CHANNELS.map((opt) => {
            const active = channel === opt.value;
            return (
              <button
                key={opt.value}
                type='button'
                onClick={() => setChannel(opt.value)}
                aria-pressed={active}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  background: active ? "var(--carolina)" : "var(--surface2)",
                  color: active ? "#fff" : "var(--text)",
                  border: `1px solid ${active ? "var(--carolina)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.label}
                <span
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 400,
                    opacity: 0.85,
                    marginTop: "2px",
                  }}
                >
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--text-secondary)",
          margin: "0 0 var(--space-4)",
          padding: "var(--space-2) var(--space-3)",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        Templates use placeholders like <code>{"{first_name}"}</code>,{" "}
        <code>{"{service}"}</code>, and <code>{"{review_link}"}</code>. Replace
        them per customer. Find your direct review link inside Google Business
        Profile → <em>Get more reviews</em>.
      </p>

      <button
        type='button'
        onClick={handleGenerate}
        disabled={loading}
        className='btn btn-primary'
      >
        {loading
          ? "Generating…"
          : variants
            ? "Regenerate"
            : "Generate templates"}
      </button>

      {error && <p style={errorStyle}>{error}</p>}

      {variants && (
        <VariantList
          variants={variants}
          copiedIdx={copiedIdx}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}

/* ----------------------------- VARIANT LIST ---------------------------- */

function VariantList({
  variants,
  copiedIdx,
  onCopy,
}: {
  variants: Variant[];
  copiedIdx: number | null;
  onCopy: (idx: number, text: string) => void;
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: "var(--space-6) 0 0",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      {variants.map((v, idx) => {
        const isCopied = copiedIdx === idx;
        const copyText = v.subject
          ? `Subject: ${v.subject}\n\n${v.text}`
          : v.text;
        return (
          <li
            key={idx}
            style={{
              padding: "var(--space-4)",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "var(--space-3)",
                marginBottom: "var(--space-2)",
              }}
            >
              <strong
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                {v.label}
              </strong>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {v.text.length} chars
              </span>
            </header>
            {v.subject && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text)",
                  margin: "0 0 var(--space-2)",
                  fontWeight: 500,
                }}
              >
                <span
                  style={{ color: "var(--text-secondary)", fontWeight: 400 }}
                >
                  Subject:{" "}
                </span>
                {v.subject}
              </p>
            )}
            <p
              style={{
                fontSize: "var(--text-sm)",
                lineHeight: 1.65,
                color: "var(--text)",
                margin: "0 0 var(--space-3)",
                whiteSpace: "pre-wrap",
              }}
            >
              {v.text}
            </p>
            <button
              type='button'
              onClick={() => onCopy(idx, copyText)}
              className='btn btn-secondary btn-sm'
            >
              {isCopied ? "Copied ✓" : "Copy"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------- STYLES -------------------------------- */

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "var(--text-sm)",
  fontWeight: 600,
  color: "var(--text)",
  marginBottom: "var(--space-2)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-3)",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text)",
  fontSize: "var(--text-sm)",
};

const errorStyle: React.CSSProperties = {
  marginTop: "var(--space-3)",
  fontSize: "var(--text-sm)",
  color: "var(--status-red)",
};
