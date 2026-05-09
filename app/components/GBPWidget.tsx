"use client";

interface GBPSnapshot {
  found: boolean;
  rating: number | null;
  reviewCount: number | null;
  photoCount: number | null;
  hasHours: boolean | null;
  auditDate: string;
  businessName: string;
}

interface Props {
  gbp: GBPSnapshot;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: "inline-flex", gap: "2px", alignItems: "center" }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full;
        const isHalf = !filled && i === full && half;
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              {isHalf && (
                <linearGradient id={`half-${i}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="var(--surface2)" />
                </linearGradient>
              )}
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={filled ? "#f59e0b" : isHalf ? `url(#half-${i})` : "var(--surface2)"}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}

function Stat({
  label,
  value,
  status,
  note,
}: {
  label: string;
  value: string;
  status?: "good" | "warn" | "bad" | "neutral";
  note?: string;
}) {
  const statusColor =
    status === "good" ? "#4ade80"
    : status === "warn" ? "#fbbf24"
    : status === "bad" ? "#f87171"
    : "var(--text)";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      padding: "var(--space-3) var(--space-4)",
      background: "var(--surface2)",
      borderRadius: "var(--radius-md)",
      flex: "1 1 0",
      minWidth: "110px",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "var(--text-lg)",
        fontWeight: 700,
        color: statusColor,
        fontFamily: "var(--font-mono)",
        lineHeight: 1.2,
      }}>
        {value}
      </span>
      {note && (
        <span style={{ fontSize: "0.65rem", color: "var(--muted)", lineHeight: 1.3 }}>
          {note}
        </span>
      )}
    </div>
  );
}

export default function GBPWidget({ gbp }: Props) {
  const auditedOn = new Date(gbp.auditDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const reviewStatus =
    gbp.reviewCount === null ? "neutral"
    : gbp.reviewCount >= 50 ? "good"
    : gbp.reviewCount >= 20 ? "warn"
    : "bad";

  const photoStatus =
    gbp.photoCount === null ? "neutral"
    : gbp.photoCount >= 10 ? "good"
    : gbp.photoCount >= 5 ? "warn"
    : "bad";

  const hoursStatus =
    gbp.hasHours === null ? "neutral"
    : gbp.hasHours ? "good"
    : "bad";

  const ratingStatus =
    gbp.rating === null ? "neutral"
    : gbp.rating >= 4.5 ? "good"
    : gbp.rating >= 4.0 ? "warn"
    : "bad";

  if (!gbp.found) {
    return (
      <div className="card card-default" style={{ padding: "var(--space-5)" }}>
        <p className="label" style={{ marginBottom: "var(--space-3)" }}>Google Business Profile</p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
          GBP not confirmed for <strong style={{ color: "var(--text)" }}>{gbp.businessName}</strong> — the Places API
          returned no match at last audit. Run a new audit to recheck.
        </p>
      </div>
    );
  }

  return (
    <div className="card card-default" style={{ padding: "var(--space-5)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "var(--space-4)",
        gap: "var(--space-3)",
        flexWrap: "wrap",
      }}>
        <div>
          <p className="label" style={{ marginBottom: "var(--space-1)" }}>Google Business Profile</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
            {gbp.businessName}
          </p>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          flexShrink: 0,
        }}>
          {gbp.rating !== null && <StarRating rating={gbp.rating} />}
          {gbp.rating !== null && (
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--text)",
              fontWeight: 600,
            }}>
              {gbp.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: "flex",
        gap: "var(--space-2)",
        flexWrap: "wrap",
        marginBottom: "var(--space-4)",
      }}>
        <Stat
          label="Rating"
          value={gbp.rating !== null ? gbp.rating.toFixed(1) : "—"}
          status={ratingStatus}
          note={ratingStatus === "warn" ? "Room to grow" : ratingStatus === "bad" ? "Below 4.0 hurts" : undefined}
        />
        <Stat
          label="Reviews"
          value={gbp.reviewCount !== null ? gbp.reviewCount.toString() : "—"}
          status={reviewStatus}
          note={reviewStatus === "bad" ? "Under 20 — priority" : reviewStatus === "warn" ? "Under 50" : undefined}
        />
        <Stat
          label="Photos"
          value={gbp.photoCount !== null ? (gbp.photoCount >= 10 ? "10+" : gbp.photoCount.toString()) : "—"}
          status={photoStatus}
          note={photoStatus === "bad" ? "Under 5 — add more" : photoStatus === "warn" ? "Under 10" : undefined}
        />
        <Stat
          label="Hours"
          value={gbp.hasHours === null ? "—" : gbp.hasHours ? "Set" : "Missing"}
          status={hoursStatus}
          note={hoursStatus === "bad" ? "Missing hours hurts ranking" : undefined}
        />
      </div>

      {/* Footer */}
      <p style={{
        fontSize: "0.65rem",
        color: "var(--muted)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.05em",
      }}>
        Snapshot from audit on {auditedOn} · Run a new audit to refresh
      </p>
    </div>
  );
}
