"use client";

import { useState } from "react";

type Check = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type ScanResult = {
  url: string;
  fetchedAt: string;
  responseTimeMs: number | null;
  httpStatus: number | null;
  htmlBytes: number | null;
  checks: Check[];
};

type ApiResponse = {
  scan: ScanResult;
  guidance: Record<string, string>;
};

const STATUS_COLOR: Record<Check["status"], string> = {
  pass: "var(--status-green)",
  warn: "var(--status-yellow)",
  fail: "var(--status-red)",
};

const STATUS_LABEL: Record<Check["status"], string> = {
  pass: "PASS",
  warn: "WARN",
  fail: "FAIL",
};

export default function TechnicalMonitor({
  auditId,
  defaultUrl,
}: {
  auditId: string;
  defaultUrl?: string | null;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/tools/technical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          url: url.trim() || undefined,
        }),
      });
      const json = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Scan failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  const summary = data
    ? {
        pass: data.scan.checks.filter((c) => c.status === "pass").length,
        warn: data.scan.checks.filter((c) => c.status === "warn").length,
        fail: data.scan.checks.filter((c) => c.status === "fail").length,
      }
    : null;

  return (
    <section
      className='card card-default'
      style={{ padding: "var(--space-6)", marginTop: "var(--space-6)" }}
    >
      <header style={{ marginBottom: "var(--space-4)" }}>
        <h2 className='heading-3' style={{ marginBottom: "var(--space-1)" }}>
          Technical Monitor
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          On-demand technical health scan. We check the things that quietly tank
          rankings: HTTPS, response time, schema, indexability, sitemap, and
          more.
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
            URL to scan
          </span>
          <input
            type='url'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='https://example.com'
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: "var(--text-sm)",
              fontFamily: "inherit",
            }}
          />
        </label>
      </div>

      <button
        type='button'
        onClick={handleScan}
        disabled={loading}
        className='btn btn-primary'
      >
        {loading ? "Scanning…" : data ? "Re-run scan" : "Run technical scan"}
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

      {data && summary && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-3)",
              marginBottom: "var(--space-4)",
              padding: "var(--space-3) var(--space-4)",
              background: "var(--surface2)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span style={{ color: "var(--status-green)" }}>
              ✓ {summary.pass} pass
            </span>
            <span style={{ color: "var(--status-yellow)" }}>
              ⚠ {summary.warn} warn
            </span>
            <span style={{ color: "var(--status-red)" }}>
              ✗ {summary.fail} fail
            </span>
            <span
              style={{ marginLeft: "auto", color: "var(--text-secondary)" }}
            >
              {data.scan.responseTimeMs ?? "—"} ms · HTTP{" "}
              {data.scan.httpStatus ?? "—"}
            </span>
          </div>

          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {data.scan.checks.map((c) => (
              <CheckRow key={c.id} check={c} guidance={data.guidance[c.id]} />
            ))}
          </div>

          <p
            className='text-small'
            style={{
              marginTop: "var(--space-4)",
              color: "var(--text-secondary)",
            }}
          >
            Scanned {new Date(data.scan.fetchedAt).toLocaleString()}.
          </p>
        </div>
      )}
    </section>
  );
}

function CheckRow({ check, guidance }: { check: Check; guidance?: string }) {
  const color = STATUS_COLOR[check.status];
  return (
    <div
      style={{
        padding: "var(--space-3) var(--space-4)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "var(--space-2)",
          marginBottom: "var(--space-1)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            color,
            minWidth: "44px",
          }}
        >
          {STATUS_LABEL[check.status]}
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            color: "var(--text)",
          }}
        >
          {check.label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        {check.detail}
      </p>
      {guidance && (
        <div
          style={{
            marginTop: "var(--space-2)",
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
            How to fix
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              color: "var(--text)",
              lineHeight: 1.5,
            }}
          >
            {guidance}
          </p>
        </div>
      )}
    </div>
  );
}
