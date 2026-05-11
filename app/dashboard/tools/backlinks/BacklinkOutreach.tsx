"use client";

import { useState } from "react";

type Prospect = {
  category: string;
  why: string;
  examples: string[];
  pitch: string;
};

type Template = {
  angle: string;
  subject: string;
  body: string;
};

type ApiResponse = {
  business: { name: string; trade: string; city: string; website: string };
  prospects: Prospect[];
  templates: Template[];
};

const ANGLE_LABEL: Record<string, string> = {
  partnership: "Partnership",
  sponsor: "Sponsorship",
  "expert-quote": "Expert quote",
};

export default function BacklinkOutreach({ auditId }: { auditId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/tools/backlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
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
          Backlink Outreach
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          Six prospect categories tailored to your trade and city, plus three
          outreach email templates ready to personalize and send.
        </p>
      </header>

      <button
        type='button'
        onClick={handleGenerate}
        disabled={loading}
        className='btn btn-primary'
      >
        {loading
          ? "Building campaign…"
          : data
            ? "Regenerate plan"
            : "Build outreach plan"}
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
          <h3 className='heading-4' style={{ marginBottom: "var(--space-3)" }}>
            Prospect categories
          </h3>
          <p
            className='text-small'
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-4)",
            }}
          >
            For each category, search Google for the examples below in{" "}
            {data.business.city}. Look for a Contact / Sponsorship / Partner
            page — that&apos;s where to pitch.
          </p>
          <div
            style={{
              display: "grid",
              gap: "var(--space-3)",
              marginBottom: "var(--space-8)",
            }}
          >
            {data.prospects.map((p, i) => (
              <ProspectCard key={i} prospect={p} index={i + 1} />
            ))}
          </div>

          <h3 className='heading-4' style={{ marginBottom: "var(--space-3)" }}>
            Outreach templates
          </h3>
          <p
            className='text-small'
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-4)",
            }}
          >
            Replace [first name] and [their org/site] before sending. Send one
            email at a time, not blasts.
          </p>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {data.templates.map((t, i) => (
              <TemplateCard key={i} template={t} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProspectCard({
  prospect,
  index,
}: {
  prospect: Prospect;
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
          marginBottom: "var(--space-2)",
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
          {prospect.category}
        </h4>
      </div>
      <p
        style={{
          margin: "0 0 var(--space-3)",
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        {prospect.why}
      </p>
      {prospect.examples.length > 0 && (
        <div style={{ marginBottom: "var(--space-3)" }}>
          <p
            className='label'
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-1)",
            }}
          >
            Search for
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "var(--space-5)",
              fontSize: "var(--text-sm)",
              color: "var(--text)",
              lineHeight: 1.6,
            }}
          >
            {prospect.examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
      <div
        style={{
          padding: "var(--space-2) var(--space-3)",
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
          Pitch angle
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text)",
            lineHeight: 1.5,
          }}
        >
          {prospect.pitch}
        </p>
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const [copied, setCopied] = useState(false);
  const fullEmail = `Subject: ${template.subject}\n\n${template.body}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

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
          justifyContent: "space-between",
          gap: "var(--space-2)",
          marginBottom: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--carolina)",
          }}
        >
          {ANGLE_LABEL[template.angle] ?? template.angle}
        </span>
        <button
          type='button'
          onClick={handleCopy}
          className='btn btn-ghost btn-sm'
        >
          {copied ? "Copied" : "Copy email"}
        </button>
      </div>
      <p
        style={{
          margin: "0 0 var(--space-2)",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        Subject: {template.subject}
      </p>
      <pre
        style={{
          margin: 0,
          padding: "var(--space-3) var(--space-4)",
          background: "var(--surface2)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          fontSize: "var(--text-sm)",
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          lineHeight: 1.6,
        }}
      >
        {template.body}
      </pre>
    </div>
  );
}
