"use client";

import { useState } from "react";

type Theme = "mixed" | "offers" | "updates" | "tips";
type Post = {
  type: "What's New" | "Offer" | "Event" | "Update";
  headline: string;
  body: string;
  ctaLabel: string;
};

const THEMES: { value: Theme; label: string; hint: string }[] = [
  { value: "mixed", label: "Mixed", hint: "One of each" },
  { value: "offers", label: "Offers", hint: "Discounts & specials" },
  { value: "updates", label: "Updates", hint: "What's new" },
  { value: "tips", label: "Tips", hint: "Educational" },
];

const TYPE_COLOR: Record<Post["type"], string> = {
  Offer: "var(--status-yellow)",
  "What's New": "var(--carolina)",
  Event: "var(--status-green)",
  Update: "var(--text-secondary)",
};

export default function WeeklyPosts({ auditId }: { auditId: string }) {
  const [theme, setTheme] = useState<Theme>("mixed");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setPosts(null);
    setCopiedIdx(null);
    try {
      const res = await fetch("/api/tools/gbp/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, theme }),
      });
      const data = (await res.json()) as { posts?: Post[]; error?: string };
      if (!res.ok || !data.posts) {
        throw new Error(data.error ?? "Generation failed");
      }
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(idx: number, post: Post) {
    const text = `${post.headline}\n\n${post.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <section
      className='card card-default'
      style={{
        padding: "var(--space-6)",
        marginTop: "var(--space-6)",
      }}
    >
      <header style={{ marginBottom: "var(--space-4)" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--carolina)",
            marginBottom: "var(--space-2)",
          }}
        >
          AI Drafts
        </span>
        <h2 className='heading-3' style={{ marginBottom: "var(--space-2)" }}>
          Weekly Post Drafts
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          Four GBP post drafts — one per week for a month. Pick a theme,
          generate, copy into Google Business Profile.
        </p>
      </header>

      <div style={{ marginBottom: "var(--space-5)" }}>
        <span
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "var(--space-2)",
          }}
        >
          Theme
        </span>
        <div
          style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
        >
          {THEMES.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type='button'
                onClick={() => setTheme(opt.value)}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  background: active ? "var(--carolina)" : "var(--surface2)",
                  color: active ? "#fff" : "var(--text)",
                  border: `1px solid ${active ? "var(--carolina)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
                aria-pressed={active}
              >
                {opt.label}
                <span
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 400,
                    opacity: 0.85,
                    marginTop: "2px",
                  }}
                >
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type='button'
        onClick={handleGenerate}
        disabled={loading}
        className='btn btn-primary'
      >
        {loading ? "Generating…" : posts ? "Regenerate" : "Generate 4 posts"}
      </button>

      {error && (
        <p
          style={{
            marginTop: "var(--space-3)",
            fontSize: "var(--text-sm)",
            color: "var(--status-red)",
          }}
        >
          {error}
        </p>
      )}

      {posts && (
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: "var(--space-6) 0 0",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            counterReset: "post-counter",
          }}
        >
          {posts.map((post, idx) => {
            const isCopied = copiedIdx === idx;
            const total = post.headline.length + post.body.length;
            return (
              <li
                key={idx}
                style={{
                  padding: "var(--space-4)",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <header
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "var(--space-3)",
                    marginBottom: "var(--space-2)",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "var(--space-2)",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Week {idx + 1}
                    </strong>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        color: TYPE_COLOR[post.type],
                      }}
                    >
                      {post.type}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-secondary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {total} chars
                  </span>
                </header>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: "0 0 var(--space-2)",
                  }}
                >
                  {post.headline}
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    lineHeight: 1.65,
                    color: "var(--text)",
                    margin: "0 0 var(--space-3)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {post.body}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      padding: "var(--space-1) var(--space-2)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "999px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Button: {post.ctaLabel}
                  </span>
                  <button
                    type='button'
                    onClick={() => handleCopy(idx, post)}
                    className='btn btn-secondary btn-sm'
                  >
                    {isCopied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
