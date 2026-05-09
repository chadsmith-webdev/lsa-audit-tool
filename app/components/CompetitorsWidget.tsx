"use client";

import type { AuditSection } from "@/lib/types";

interface Props {
  section: AuditSection;
  competitorNames: string[];
  auditDate: string;
  businessName: string;
}

const STATUS_COLORS: Record<string, string> = {
  green: "#4ade80",
  yellow: "#fbbf24",
  red: "#f87171",
};

const STATUS_LABELS: Record<string, string> = {
  green: "Holding Ground",
  yellow: "Losing Ground",
  red: "Getting Buried",
};

function ScoreBadge({ score, status }: { score: number; status: string }) {
  const color = STATUS_COLORS[status] ?? "var(--text)";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "60px",
        height: "60px",
        borderRadius: "var(--radius-full)",
        border: `2px solid ${color}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1.25rem",
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          color: "var(--muted)",
          letterSpacing: "0.05em",
        }}
      >
        /10
      </span>
    </div>
  );
}

export default function CompetitorsWidget({
  section,
  competitorNames,
  auditDate,
  businessName,
}: Props) {
  const auditedOn = new Date(auditDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const statusColor = STATUS_COLORS[section.status] ?? "var(--text)";
  const statusLabel = STATUS_LABELS[section.status] ?? section.status;
  const names = competitorNames.filter(Boolean).slice(0, 5);

  return (
    <div className="card card-default" style={{ padding: "var(--space-5)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="label" style={{ marginBottom: "var(--space-1)" }}>
            Map Pack Competitors
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
            {businessName}
          </p>
        </div>
        <ScoreBadge score={section.score} status={section.status} />
      </div>

      {/* Status pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          marginBottom: "var(--space-3)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: statusColor,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            background: `${statusColor}18`,
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            border: `1px solid ${statusColor}40`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Headline */}
      <p
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: "var(--space-2)",
          lineHeight: 1.4,
        }}
      >
        {section.headline}
      </p>

      {/* Finding */}
      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--muted)",
          lineHeight: 1.6,
          marginBottom: "var(--space-4)",
        }}
      >
        {section.finding}
      </p>

      {/* Competitor name list */}
      {names.length > 0 && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "var(--space-2)",
            }}
          >
            In the Map Pack
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {names.map((name, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text)",
                  background: "var(--surface2)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-2) var(--space-3)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "var(--muted)",
                    minWidth: "16px",
                  }}
                >
                  #{i + 1}
                </span>
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Priority action */}
      <div
        style={{
          background: "var(--surface2)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-3) var(--space-4)",
          marginBottom: "var(--space-4)",
          borderLeft: `3px solid ${statusColor}`,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "var(--space-1)",
          }}
        >
          Priority Action
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text)", lineHeight: 1.5 }}>
          {section.priority_action}
        </p>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: "0.65rem",
          color: "var(--muted)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
        }}
      >
        Map Pack snapshot from audit on {auditedOn} · Run a new audit to refresh
      </p>
    </div>
  );
}
