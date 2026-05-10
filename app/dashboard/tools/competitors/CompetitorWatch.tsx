"use client";

import { useState } from "react";

type CompetitorBrief = {
  name: string;
  likely_strengths: string[];
  likely_weaknesses: string[];
  how_to_beat: string;
};

type ApiResponse = {
  business: {
    name: string;
    trade: string;
    city: string;
    rating: number | null;
    reviewCount: number | null;
  };
  competitors: CompetitorBrief[];
  overall_strategy: string;
};

export default function CompetitorWatch({ auditId }: { auditId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/tools/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });
      const json = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
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
          Competitor Watch
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          Competitive intel on the businesses ranking ahead of you. Likely
          strengths, likely weaknesses, and one specific way to win against each
          one.
        </p>
      </header>

      <button
        type='button'
        onClick={handleAnalyze}
        disabled={loading}
        className='btn btn-primary'
      >
        {loading
          ? "Analyzing…"
          : data
            ? "Re-run analysis"
            : "Analyze competitors"}
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
          <div
            style={{
              padding: "var(--space-4) var(--space-5)",
              background: "var(--carolina-dim)",
              border: "1px solid var(--border-accent)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-6)",
            }}
          >
            <p
              className='label'
              style={{
                color: "var(--carolina)",
                marginBottom: "var(--space-2)",
              }}
            >
              Overall positioning play
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-base)",
                color: "var(--text)",
                lineHeight: 1.6,
              }}
            >
              {data.overall_strategy}
            </p>
          </div>

          <h3 className='heading-4' style={{ marginBottom: "var(--space-3)" }}>
            Competitor breakdown
          </h3>
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            {data.competitors.map((c, i) => (
              <CompetitorCard key={i} comp={c} index={i + 1} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CompetitorCard({
  comp,
  index,
}: {
  comp: CompetitorBrief;
  index: number;
}) {
  return (
    <div
      style={{
        padding: "var(--space-4) var(--space-5)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "var(--space-2)",
          marginBottom: "var(--space-3)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            color: "var(--text-secondary)",
          }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <h4
          style={{
            margin: 0,
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {comp.name}
        </h4>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-3)",
          marginBottom: "var(--space-3)",
        }}
      >
        <SignalList
          label='Likely strengths'
          items={comp.likely_strengths}
          accent='var(--status-green)'
        />
        <SignalList
          label='Likely gaps'
          items={comp.likely_weaknesses}
          accent='var(--status-yellow)'
        />
      </div>

      <div
        style={{
          padding: "var(--space-3) var(--space-4)",
          background: "var(--surface2)",
          borderRadius: "var(--radius-sm)",
          borderLeft: "3px solid var(--carolina)",
        }}
      >
        <p
          className='label'
          style={{
            color: "var(--text-secondary)",
            marginBottom: "var(--space-1)",
          }}
        >
          How to beat them
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text)",
            lineHeight: 1.5,
          }}
        >
          {comp.how_to_beat}
        </p>
      </div>
    </div>
  );
}

function SignalList({
  label,
  items,
  accent,
}: {
  label: string;
  items: string[];
  accent: string;
}) {
  return (
    <div>
      <p
        className='label'
        style={{
          color: "var(--text-secondary)",
          marginBottom: "var(--space-2)",
          borderLeft: `3px solid ${accent}`,
          paddingLeft: "var(--space-2)",
        }}
      >
        {label}
      </p>
      <ul
        style={{
          margin: 0,
          paddingLeft: "var(--space-5)",
          fontSize: "var(--text-sm)",
          color: "var(--text)",
          lineHeight: 1.5,
        }}
      >
        {items.length ? (
          items.map((s, i) => (
            <li key={i} style={{ marginBottom: "var(--space-1)" }}>
              {s}
            </li>
          ))
        ) : (
          <li style={{ color: "var(--text-secondary)" }}>—</li>
        )}
      </ul>
    </div>
  );
}
