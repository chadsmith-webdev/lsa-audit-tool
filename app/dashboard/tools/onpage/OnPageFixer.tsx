"use client";

import { useState } from "react";

type Tone = "professional" | "friendly" | "premium";
type Suggestion = { text: string; length: number; rationale: string };
type ApiResponse = {
  current: {
    url: string;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    fetchError: string | null;
  };
  suggestions: {
    titles: Suggestion[];
    metas: Suggestion[];
    h1s: Suggestion[];
  };
};

const TONE_OPTIONS: { value: Tone; label: string; hint: string }[] = [
  { value: "professional", label: "Professional", hint: "Plainspoken" },
  { value: "friendly", label: "Friendly", hint: "Warm" },
  { value: "premium", label: "Premium", hint: "Quietly upscale" },
];

const LIMITS = { title: 60, meta: 160, h1: 70 } as const;

type Props = { auditId: string; defaultUrl: string | null };

export default function OnPageFixer({ auditId, defaultUrl }: Props) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [tone, setTone] = useState<Tone>("professional");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/tools/onpage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, url: url.trim() || undefined, tone }),
      });
      const json = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className='card card-default'
      style={{ padding: "var(--space-6)", marginTop: "var(--space-6)" }}
    >
      <header style={{ marginBottom: "var(--space-4)" }}>
        <h2 className='heading-3' style={{ marginBottom: "var(--space-1)" }}>
          On-Page Fixer
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          AI-rewritten title, meta description, and H1 ready to paste into your
          CMS. We fetch your live page so suggestions improve what's already
          there.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
        }}
      >
        <label style={{ display: "block" }}>
          <span
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--space-2)",
            }}
          >
            Page URL
          </span>
          <input
            type='url'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='https://example.com/services/plumbing'
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-mono)",
            }}
          />
          <span
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              marginTop: "var(--space-1)",
            }}
          >
            Defaults to your audited site. Change it to optimize a service or
            location page instead.
          </span>
        </label>

        <div>
          <span
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--space-2)",
            }}
          >
            Tone
          </span>
          <div
            style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
          >
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type='button'
                onClick={() => setTone(opt.value)}
                className={
                  tone === opt.value
                    ? "btn btn-primary btn-sm"
                    : "btn btn-ghost btn-sm"
                }
                style={{ flexDirection: "column", alignItems: "flex-start" }}
              >
                <span style={{ fontWeight: 600 }}>{opt.label}</span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    opacity: 0.7,
                    fontWeight: 400,
                  }}
                >
                  {opt.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={handleGenerate}
        disabled={loading || !url.trim()}
        className='btn btn-primary'
      >
        {loading ? "Optimizing…" : data ? "Regenerate" : "Optimize this page"}
      </button>

      {error && (
        <p
          role='alert'
          style={{
            marginTop: "var(--space-3)",
            fontSize: "var(--text-sm)",
            color: "var(--status-red)",
          }}
        >
          {error}
        </p>
      )}

      {data && (
        <div style={{ marginTop: "var(--space-6)" }}>
          {data.current.fetchError ? (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--status-yellow)",
                marginBottom: "var(--space-4)",
              }}
            >
              Couldn't fetch the live page ({data.current.fetchError}).
              Suggestions are generated from scratch — double-check them against
              your CMS before publishing.
            </p>
          ) : null}

          <SuggestionGroup
            label='Title Tag'
            limit={LIMITS.title}
            current={data.current.title}
            items={data.suggestions.titles}
          />
          <SuggestionGroup
            label='Meta Description'
            limit={LIMITS.meta}
            current={data.current.metaDescription}
            items={data.suggestions.metas}
          />
          <SuggestionGroup
            label='H1 Heading'
            limit={LIMITS.h1}
            current={data.current.h1}
            items={data.suggestions.h1s}
          />
        </div>
      )}
    </section>
  );
}

function SuggestionGroup({
  label,
  limit,
  current,
  items,
}: {
  label: string;
  limit: number;
  current: string | null;
  items: Suggestion[];
}) {
  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <h3 className='heading-4' style={{ marginBottom: "var(--space-2)" }}>
        {label}
      </h3>
      {current ? (
        <div
          style={{
            padding: "var(--space-2) var(--space-3)",
            background: "var(--surface2)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-3)",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              marginRight: "var(--space-2)",
            }}
          >
            Current:
          </span>
          {current}
        </div>
      ) : (
        <p
          className='text-small'
          style={{
            marginBottom: "var(--space-3)",
            color: "var(--text-secondary)",
          }}
        >
          No {label.toLowerCase()} detected on the page.
        </p>
      )}

      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {items.map((item, idx) => (
          <SuggestionCard key={idx} item={item} limit={limit} />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ item, limit }: { item: Suggestion; limit: number }) {
  const [copied, setCopied] = useState(false);
  const over = item.length > limit;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(item.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div
      style={{
        padding: "var(--space-3) var(--space-4)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
      }}
    >
      <p
        style={{
          fontSize: "var(--text-base)",
          color: "var(--text)",
          marginBottom: "var(--space-2)",
          lineHeight: 1.4,
        }}
      >
        {item.text}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          marginBottom: "var(--space-2)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            color: over ? "var(--status-red)" : "var(--text-secondary)",
          }}
        >
          {item.length} / {limit} chars
          {over ? " · over limit" : ""}
        </span>
        <button
          type='button'
          onClick={handleCopy}
          className='btn btn-ghost btn-sm'
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--text-secondary)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {item.rationale}
      </p>
    </div>
  );
}
