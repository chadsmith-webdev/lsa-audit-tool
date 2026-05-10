"use client";

/**
 * UpgradeSlot — the seam where future paid-tier tools attach to each widget.
 *
 * On the free tier this renders a thin "Pro tool coming soon" strip below
 * a widget so the upgrade surface is visible and the layout is reserved.
 *
 * When a paid tool ships, the matching entry in TOOL_CATALOG can be flipped
 * (status: "available") and the slot will render an action button into the
 * tool's app — no widget refactor needed.
 *
 * Tools are sold à la carte or as a bundle; the per-slot pricing is hinted
 * here but the actual checkout flow lives outside this component.
 */

export type ToolSlug =
  | "gbp"
  | "reviews"
  | "citations"
  | "competitors"
  | "backlinks"
  | "onpage"
  | "technical"
  | "ai-visibility";

type ToolStatus = "soon" | "available";

interface ToolEntry {
  name: string;
  blurb: string;
  status: ToolStatus;
  href?: string; // populated when status === "available"
}

const TOOL_CATALOG: Record<ToolSlug, ToolEntry> = {
  gbp: {
    name: "GBP Optimizer",
    blurb:
      "Auto-detect missing hours, photos, and categories — fix in one click.",
    status: "soon",
  },
  reviews: {
    name: "Review Engine",
    blurb: "Request reviews via SMS + email with smart follow-ups.",
    status: "soon",
  },
  citations: {
    name: "Citation Builder",
    blurb: "Push your NAP to 60+ directories and monitor for drift.",
    status: "soon",
  },
  competitors: {
    name: "Competitor Watch",
    blurb: "Weekly alerts when a competitor's score, reviews, or rank changes.",
    status: "soon",
  },
  backlinks: {
    name: "Backlink Outreach",
    blurb: "Trade-relevant link prospects with templated outreach.",
    status: "soon",
  },
  onpage: {
    name: "On-Page Fixer",
    blurb: "AI-rewritten titles, metas, and headings ready to paste in.",
    status: "soon",
  },
  technical: {
    name: "Technical Monitor",
    blurb:
      "Daily crawl with alerts for broken pages, slow loads, and indexing issues.",
    status: "soon",
  },
  "ai-visibility": {
    name: "AI Citability Booster",
    blurb:
      "Schema, FAQ, and entity signals tuned for ChatGPT + Perplexity citations.",
    status: "soon",
  },
};

export default function UpgradeSlot({ tool }: { tool: ToolSlug }) {
  const entry = TOOL_CATALOG[tool];
  const isSoon = entry.status === "soon";

  return (
    <div
      role='note'
      aria-label={`${entry.name} — ${isSoon ? "coming soon" : "available"}`}
      style={{
        marginTop: "var(--space-2)",
        padding: "var(--space-3) var(--space-4)",
        border: "1px dashed var(--border-accent)",
        borderRadius: "10px",
        background: "var(--carolina-dim)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--carolina)",
            background: "var(--bg)",
            border: "1px solid var(--border-accent)",
            borderRadius: "999px",
            padding: "2px 10px",
            flexShrink: 0,
          }}
        >
          Pro · {isSoon ? "Soon" : "Live"}
        </span>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {entry.name}
          </p>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {entry.blurb}
          </p>
        </div>
      </div>
      {isSoon ? (
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-secondary)",
            flexShrink: 0,
          }}
        >
          In development
        </span>
      ) : entry.href ? (
        <a
          href={entry.href}
          className='btn btn-primary btn-sm'
          style={{ flexShrink: 0 }}
        >
          Open →
        </a>
      ) : null}
    </div>
  );
}
