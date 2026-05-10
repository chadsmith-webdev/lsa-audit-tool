"use client";

import { useState } from "react";

type Tone = "professional" | "friendly" | "premium";
type Variant = { label: string; length: number; text: string };

const TONE_OPTIONS: { value: Tone; label: string; hint: string }[] = [
  {
    value: "professional",
    label: "Professional",
    hint: "Plainspoken, confident",
  },
  { value: "friendly", label: "Friendly", hint: "Warm, approachable" },
  { value: "premium", label: "Premium", hint: "Quietly upscale" },
];

const GBP_LIMIT = 750;

export default function DescriptionRewriter({ auditId }: { auditId: string }) {
  const [current, setCurrent] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
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
      const res = await fetch("/api/tools/gbp/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, current, tone }),
      });
      const data = (await res.json()) as {
        variants?: Variant[];
        error?: string;
      };
      if (!res.ok || !data.variants) {
        throw new Error(data.error ?? "Generation failed");
      }
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
    <section
      className='card card-default'
      style={{
        padding: "var(--space-6)",
        marginTop: "var(--space-8)",
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
          AI Rewrite
        </span>
        <h2 className='heading-3' style={{ marginBottom: "var(--space-2)" }}>
          Description Rewriter
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          Generate three Google Business Profile description variants. Paste
          your current description for a rewrite, or leave blank to start fresh.
        </p>
      </header>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          htmlFor='gbp-current'
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "var(--space-2)",
          }}
        >
          Current description{" "}
          <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>
            (optional)
          </span>
        </label>
        <textarea
          id='gbp-current'
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder='Paste what you have on Google Business Profile today, or leave blank.'
          rows={4}
          style={{
            width: "100%",
            padding: "var(--space-3)",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text)",
            fontSize: "var(--text-sm)",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ marginBottom: "var(--space-5)" }}>
        <span
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "var(--space-2)",
          }}
        >
          Tone
        </span>
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            flexWrap: "wrap",
          }}
        >
          {TONE_OPTIONS.map((opt) => {
            const active = tone === opt.value;
            return (
              <button
                key={opt.value}
                type='button'
                onClick={() => setTone(opt.value)}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  background: active ? "var(--carolina)" : "var(--surface2)",
                  color: active ? "#fff" : "var(--text)",
                  border: `1px solid ${active ? "var(--carolina)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                aria-pressed={active}
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
            : "Generate variants"}
      </button>

      {error && (
        <p
          style={{
            marginTop: "var(--space-3)",
            fontSize: "var(--text-sm)",
            color: "var(--status-red)",
          }}
        >
          {error}
        </p>
      )}

      {variants && (
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
            const overLimit = v.length > GBP_LIMIT;
            const isCopied = copiedIdx === idx;
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
                      color: overLimit
                        ? "var(--status-red)"
                        : "var(--text-secondary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {v.length} / {GBP_LIMIT}
                  </span>
                </header>
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
                  onClick={() => handleCopy(idx, v.text)}
                  className='btn btn-secondary btn-sm'
                >
                  {isCopied ? "Copied ✓" : "Copy"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
