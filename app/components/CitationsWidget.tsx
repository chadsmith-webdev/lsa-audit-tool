"use client";

import type { AuditSection } from "@/lib/types";
import ScoreBadge from "@/app/components/ScoreBadge";
import StatusPill from "@/app/components/StatusPill";

interface Props {
  section: AuditSection;
  auditDate: string;
  businessName: string;
}

const STATUS_LABELS: Record<string, string> = {
  green: "Good",
  yellow: "Needs Work",
  red: "Critical",
};

const STATUS_COLOR: Record<string, string> = {
  green: "var(--status-green)",
  yellow: "var(--status-yellow)",
  red: "var(--status-red)",
};

export default function CitationsWidget({ section, businessName }: Props) {
  const statusColor = STATUS_COLOR[section.status] ?? "var(--text)";
  const statusLabel = STATUS_LABELS[section.status] ?? section.status;

  return (
    <div className="card card-default" style={{ padding: "var(--space-5)" }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "var(--space-4)",
        gap: "var(--space-3)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="label" style={{ marginBottom: "var(--space-1)" }}>Citations &amp; NAP Consistency</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>{businessName}</p>
        </div>
        <ScoreBadge score={section.score} status={section.status} />
      </div>

      <div style={{ marginBottom: "var(--space-3)" }}>
        <StatusPill status={section.status} label={statusLabel} />
      </div>

      <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text)", marginBottom: "var(--space-2)", lineHeight: 1.4 }}>
        {section.headline}
      </p>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
        {section.finding}
      </p>

      <div style={{
        background: "var(--surface2)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-3) var(--space-4)",
        borderLeft: `3px solid ${statusColor}`,
      }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "var(--space-1)",
        }}>
          Priority Action
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text)", lineHeight: 1.5 }}>
          {section.priority_action}
        </p>
      </div>
    </div>
  );
}
