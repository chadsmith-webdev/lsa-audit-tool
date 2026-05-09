"use client";

import type { AuditSection } from "@/lib/types";

interface Props {
  section: AuditSection;
  auditDate: string;
  businessName: string;
}

const STATUS_COLORS = {
  green: "rgba(34,197,94,0.15)",
  yellow: "rgba(234,179,8,0.15)",
  red: "rgba(239,68,68,0.15)",
};

const STATUS_BORDER = {
  green: "rgba(34,197,94,0.4)",
  yellow: "rgba(234,179,8,0.4)",
  red: "rgba(239,68,68,0.4)",
};

const STATUS_TEXT = {
  green: "rgb(34,197,94)",
  yellow: "rgb(234,179,8)",
  red: "rgb(239,68,68)",
};

const STATUS_LABELS = {
  green: "Strong",
  yellow: "Needs Attention",
  red: "At Risk",
};

const SUB_SIGNAL_LABELS: Record<string, string> = {
  grounding: "GBP Consistency",
  review_density: "Review Signals",
  photo_freshness: "Photo Activity",
  schema_markup: "Schema Markup",
};

const SUB_SIGNAL_STATUS: Record<string, "green" | "yellow" | "red"> = {
  strong: "green",
  partial: "yellow",
  weak: "red",
  unknown: "yellow",
};

export default function AICitabilityWidget({ section, auditDate, businessName }: Props) {
  const status = section.status as "green" | "yellow" | "red";
  const date = new Date(auditDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{
        background: "var(--surface2)",
        border: `1px solid ${STATUS_BORDER[status]}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
        {/* Score badge */}
        <div
          style={{
            background: STATUS_COLORS[status],
            border: `1px solid ${STATUS_BORDER[status]}`,
            borderRadius: "var(--radius-md)",
            minWidth: 52,
            height: 52,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: STATUS_TEXT[status],
              fontFamily: "var(--font-mono)",
              lineHeight: 1,
            }}
          >
            {section.score}
          </span>
          <span style={{ fontSize: "0.6rem", color: "var(--muted)", lineHeight: 1 }}>/10</span>
        </div>

        {/* Title + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--muted)",
              }}
            >
              AI Visibility
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: STATUS_TEXT[status],
                background: STATUS_COLORS[status],
                border: `1px solid ${STATUS_BORDER[status]}`,
                borderRadius: "var(--radius-full)",
                padding: "2px 8px",
              }}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text)",
              lineHeight: 1.3,
            }}
          >
            {section.headline}
          </p>
        </div>
      </div>

      {/* Sub-signal badges */}
      {section.sub_signals && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {(Object.entries(section.sub_signals) as [string, string][]).map(([key, value]) => {
            const s = SUB_SIGNAL_STATUS[value] ?? "yellow";
            return (
              <span
                key={key}
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: STATUS_TEXT[s],
                  background: STATUS_COLORS[s],
                  border: `1px solid ${STATUS_BORDER[s]}`,
                  borderRadius: "var(--radius-full)",
                  padding: "3px 10px",
                }}
              >
                {SUB_SIGNAL_LABELS[key] ?? key}
              </span>
            );
          })}
        </div>
      )}

      {/* Finding */}
      <p
        style={{
          margin: 0,
          fontSize: "0.8rem",
          color: "var(--muted)",
          lineHeight: 1.5,
        }}
      >
        {section.finding}
      </p>

      {/* Priority action */}
      {section.priority_action && (
        <div
          style={{
            borderLeft: `3px solid ${STATUS_BORDER[status]}`,
            paddingLeft: "var(--space-3)",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "0.65rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--muted)",
              marginBottom: 4,
            }}
          >
            Next step
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.4 }}>
            {section.priority_action}
          </span>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--surface2)",
          paddingTop: "var(--space-2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{businessName}</span>
        <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{date}</span>
      </div>
    </div>
  );
}
