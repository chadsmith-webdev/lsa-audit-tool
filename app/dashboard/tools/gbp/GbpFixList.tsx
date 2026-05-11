"use client";

import { useEffect, useState } from "react";
import type { GbpFix, FixSeverity } from "@/lib/tools/gbp-optimizer";

/**
 * Fix list with persistent "completed" state.
 *
 * v1: state lives in localStorage keyed by audit id. Migrate to a
 * `tool_completions` table when we ship the rest of the paid tier.
 */

const SEVERITY_LABEL: Record<FixSeverity, string> = {
  critical: "Critical",
  important: "Important",
  polish: "Polish",
};

const SEVERITY_COLOR: Record<FixSeverity, string> = {
  critical: "var(--status-red)",
  important: "var(--status-yellow)",
  polish: "var(--carolina)",
};

export default function GbpFixList({
  fixes,
  auditId,
}: {
  fixes: GbpFix[];
  auditId: string;
}) {
  const storageKey = `gbp-fixes-completed:${auditId}`;
  const [done, setDone] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {
      // ignore — quota or parse errors fall back to empty set
    }
    return new Set();
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration flag to gate progress UI until client mount
    setHydrated(true);
  }, []);

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const completed = done.size;
  const total = fixes.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div>
      {/* Progress strip */}
      <div
        style={{
          padding: "var(--space-4)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "var(--space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            {hydrated
              ? `${completed} of ${total} fixed`
              : `${total} fixes detected`}
          </span>
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text)",
              fontWeight: 600,
            }}
          >
            {hydrated ? `${pct}%` : ""}
          </span>
        </div>
        <div
          style={{
            height: "6px",
            background: "var(--surface2)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
          role='progressbar'
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "var(--gradient-cta, var(--carolina))",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Fix cards */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {fixes.map((fix) => {
          const isDone = done.has(fix.id);
          return (
            <li key={fix.id}>
              <article
                className='card card-default'
                style={{
                  padding: "var(--space-5)",
                  opacity: isDone ? 0.55 : 1,
                  borderLeft: `3px solid ${SEVERITY_COLOR[fix.severity]}`,
                  transition: "opacity 0.2s ease",
                }}
              >
                <header
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "var(--space-3)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "var(--text-xs)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: SEVERITY_COLOR[fix.severity],
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      {SEVERITY_LABEL[fix.severity]}
                    </span>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-lg)",
                        fontWeight: 600,
                        color: "var(--text)",
                        margin: 0,
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {fix.title}
                    </h3>
                  </div>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      cursor: "pointer",
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                      flexShrink: 0,
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={isDone}
                      onChange={() => toggle(fix.id)}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "var(--carolina)",
                      }}
                    />
                    {isDone ? "Done" : "Mark done"}
                  </label>
                </header>

                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    lineHeight: 1.65,
                    color: "var(--text-secondary)",
                    margin: "0 0 var(--space-3)",
                  }}
                >
                  <strong style={{ color: "var(--text)", fontWeight: 600 }}>
                    Why it matters:{" "}
                  </strong>
                  {fix.why}
                </p>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    lineHeight: 1.65,
                    color: "var(--text-secondary)",
                    margin: "0 0 var(--space-4)",
                  }}
                >
                  <strong style={{ color: "var(--text)", fontWeight: 600 }}>
                    How to fix:{" "}
                  </strong>
                  {fix.how}
                </p>

                {fix.actionHref && (
                  <a
                    href={fix.actionHref}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-secondary btn-sm'
                  >
                    {fix.actionLabel ?? "Open in GBP"} ↗
                  </a>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
