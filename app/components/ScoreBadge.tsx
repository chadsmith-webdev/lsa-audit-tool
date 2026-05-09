interface Props {
  score: number;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  green: "var(--status-green)",
  yellow: "var(--status-yellow)",
  red: "var(--status-red)",
};

export default function ScoreBadge({ score, status }: Props) {
  const color = STATUS_COLOR[status] ?? "var(--text)";
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "60px",
      height: "60px",
      borderRadius: "var(--radius-full)",
      border: `2px solid ${color}`,
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-md)",
        fontWeight: 700,
        color,
        lineHeight: 1,
      }}>
        {score}
      </span>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        color: "var(--muted)",
        letterSpacing: "0.05em",
      }}>
        /10
      </span>
    </div>
  );
}
