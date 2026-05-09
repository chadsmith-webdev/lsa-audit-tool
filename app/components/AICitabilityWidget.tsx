"use client";

import type { AuditSection } from "@/lib/types";
import StatusPill from "@/app/components/StatusPill";

interface Props {
  section: AuditSection;
  auditDate: string;
  businessName: string;
}

const STATUS_COLOR: Record<string, string> = {
  green: "var(--status-green)",
  yellow: "var(--status-yellow)",
  red: "var(--status-red)",
};

const STATUS_BG: Record<string, string> = {
  green: "var(--status-green-dim)",
  yellow: "var(--status-yellow-dim)",
  red: "var(--status-red-dim)",
};

const STATUS_BORDER: Record<string, string> = {
  green: "var(--status-green-mid)",
  yellow: "var(--status-yellow-mid)",
  red: "var(--status-red-mid)",
};

const STATUS_LABELS: Record<string, string> = {
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

export default function AICitabilityWidget({ section, businessName }: Props) {
  const status = section.status as "green" | "yellow" | "red";
  const statusColor = STATUS_COLOR[status] ?? "var(--text)";
  const statusBorder = STATUS_BORDER[status] ?? "var(--border)";
  const statusBg = STATUS_BG[status] ?? "transparent";

  return (
    <div className="card card-default" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
        {/* Score badge — square filled variant for AI widget */}
        <div style={{
          background: statusBg,
          border: `1px solid ${statusBorder}`,
          borderRadius: "var(--radius-md)",
          minWidth: 52,
          height: 52,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: statusColor, fontFamily: "var(--font-mono)", lineHeight: 1 }}>
            {section.score}
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", lineHeight: 1 }}>/10</span>
        </div>

        {/* Title + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-1)" }}>
            <p className="label">AI Visibility</p>
            <StatusPill status={status} label={STATUS_LABELS[status] ?? status} />
          </div>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
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
              <StatusPill key={key} status={s} label={SUB_SIGNAL_LABELS[key] ?? key} />
            );
          })}
        </div>
      )}

      {/* Finding */}
      <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.5 }}>
        {section.finding}
      </p>

      {/* Priority action */}
      {section.priority_action && (
        <div style={{ borderLeft: `3px solid ${statusColor}`, paddingLeft: "var(--space-3)" }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted)",
            marginBottom: "var(--space-1)",
          }}>
            Next step
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text)", lineHeight: 1.4 }}>
            {section.priority_action}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>{businessName}</span>
      </div>
    </div>
  );
}
