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
      "Prioritized fix list for hours, photos, reviews, and posts — with the why behind each one.",
    status: "available",
    href: "/dashboard/tools/gbp",
  },
  reviews: {
    name: "Review Engine",
    blurb:
      "AI-drafted review replies and request templates for SMS, email, and post-job follow-up.",
    status: "available",
    href: "/dashboard/tools/reviews",
  },
  citations: {
    name: "Citation Builder",
    blurb:
      "20 high-value directories with ready-to-paste NAP and descriptions for each.",
    status: "available",
    href: "/dashboard/tools/citations",
  },
  competitors: {
    name: "Competitor Watch",
    blurb:
      "Strengths, gaps, and a specific way to beat each business ranking ahead of you.",
    status: "available",
    href: "/dashboard/tools/competitors",
  },
  backlinks: {
    name: "Backlink Outreach",
    blurb:
      "Trade-specific link prospects for your city, with ready-to-send outreach emails.",
    status: "available",
    href: "/dashboard/tools/backlinks",
  },
  onpage: {
    name: "On-Page Fixer",
    blurb:
      "AI-rewritten titles, meta descriptions, and H1s ready to paste in your CMS.",
    status: "available",
    href: "/dashboard/tools/onpage",
  },
  technical: {
    name: "Technical Monitor",
    blurb:
      "On-demand technical scan with measured speed, schema, indexability, and AI fix guidance.",
    status: "available",
    href: "/dashboard/tools/technical",
  },
  "ai-visibility": {
    name: "AI Citability Booster",
    blurb:
      "Schema, FAQ, and entity signals tuned for ChatGPT + Perplexity citations.",
    status: "available",
    href: "/dashboard/tools/ai-citability",
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
        position: "relative",
        zIndex: 2,
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
