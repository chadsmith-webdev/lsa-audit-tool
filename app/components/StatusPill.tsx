interface Props {
  status: string;
  label: string;
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

export default function StatusPill({ status, label }: Props) {
  const color = STATUS_COLOR[status] ?? "var(--text)";
  const bg = STATUS_BG[status] ?? "transparent";
  const border = STATUS_BORDER[status] ?? "var(--border)";

  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-xs)",
      fontWeight: 700,
      color,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      background: bg,
      padding: "2px 8px",
      borderRadius: "var(--radius-full)",
      border: `1px solid ${border}`,
    }}>
      {label}
    </span>
  );
}
