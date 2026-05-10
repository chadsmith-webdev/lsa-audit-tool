"use client";

import { useEffect, useMemo, useState } from "react";
import type { CitationDirectory } from "@/lib/tools/citation-directories";

type Descriptions = { short: string; medium: string; long: string };
type Nap = {
  businessName: string;
  phone: string;
  address: string;
  website: string;
  city: string;
  trade: string;
};
type ApiResponse = {
  nap: Nap;
  descriptions: Descriptions;
  directories: CitationDirectory[];
};

type Props = {
  auditId: string;
  defaultPhone?: string | null;
  defaultAddress?: string | null;
  defaultWebsite?: string | null;
};

export default function CitationBuilder({
  auditId,
  defaultPhone,
  defaultAddress,
  defaultWebsite,
}: Props) {
  const [services, setServices] = useState("");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [address, setAddress] = useState(defaultAddress ?? "");
  const [website, setWebsite] = useState(defaultWebsite ?? "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const storageKey = `citations:done:${auditId}`;

  // Restore checklist state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCompleted(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Persist checklist state
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completed));
    } catch {
      /* ignore */
    }
  }, [completed, storageKey]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const list = services
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/tools/citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          services: list,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          website: website.trim() || undefined,
        }),
      });
      const json = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function toggle(slug: string) {
    setCompleted((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  const completedCount = useMemo(
    () => Object.values(completed).filter(Boolean).length,
    [completed],
  );

  return (
    <section
      className='card card-default'
      style={{ padding: "var(--space-6)", marginTop: "var(--space-6)" }}
    >
      <header style={{ marginBottom: "var(--space-4)" }}>
        <h2 className='heading-3' style={{ marginBottom: "var(--space-1)" }}>
          Citation Builder
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          The 20 directories that move the needle for local contractors, plus
          ready-to-paste business descriptions in three lengths. Check each off
          as you submit.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
        }}
      >
        <Field
          label='Services'
          hint='Comma or newline separated. Used in description copy.'
        >
          <textarea
            value={services}
            onChange={(e) => setServices(e.target.value)}
            rows={2}
            style={inputStyle}
          />
        </Field>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-3)",
          }}
        >
          <Field label='Phone'>
            <input
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='479-555-0100'
              style={inputStyle}
            />
          </Field>
          <Field label='Website'>
            <input
              type='url'
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder='https://example.com'
              style={inputStyle}
            />
          </Field>
        </div>
        <Field label='Street address'>
          <input
            type='text'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder='123 Main St'
            style={inputStyle}
          />
        </Field>
      </div>

      <button
        type='button'
        onClick={handleGenerate}
        disabled={loading}
        className='btn btn-primary'
      >
        {loading
          ? "Building list…"
          : data
            ? "Regenerate descriptions"
            : "Build citation plan"}
      </button>

      {error && (
        <p
          role='alert'
          style={{
            marginTop: "var(--space-3)",
            fontSize: "var(--text-sm)",
            color: "var(--status-red)",
          }}
        >
          {error}
        </p>
      )}

      {data && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <NapBlock nap={data.nap} />
          <DescriptionsBlock descriptions={data.descriptions} />

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "var(--space-3)",
              }}
            >
              <h3 className='heading-4' style={{ margin: 0 }}>
                Directories
              </h3>
              <span
                className='text-small'
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-secondary)",
                }}
              >
                {completedCount} / {data.directories.length} done
              </span>
            </div>

            {[1, 2, 3].map((tier) => {
              const items = data.directories.filter((d) => d.tier === tier);
              if (!items.length) return null;
              return (
                <div key={tier} style={{ marginBottom: "var(--space-4)" }}>
                  <p
                    className='label'
                    style={{
                      color: "var(--text-secondary)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    {tier === 1
                      ? "Tier 1 · Must-have core"
                      : tier === 2
                        ? "Tier 2 · Strong supplemental"
                        : "Tier 3 · Trade-specific"}
                  </p>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    {items.map((dir) => (
                      <DirectoryRow
                        key={dir.slug}
                        dir={dir}
                        descriptions={data.descriptions}
                        checked={!!completed[dir.slug]}
                        onToggle={() => toggle(dir.slug)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-2) var(--space-3)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "var(--text-sm)",
  fontFamily: "inherit",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "var(--space-2)",
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span
          style={{
            display: "block",
            fontSize: "var(--text-xs)",
            color: "var(--text-secondary)",
            marginTop: "var(--space-1)",
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }
  return (
    <button type='button' onClick={handleCopy} className='btn btn-ghost btn-sm'>
      {copied ? "Copied" : label}
    </button>
  );
}

function NapBlock({ nap }: { nap: Nap }) {
  const lines = [
    `Business name: ${nap.businessName}`,
    nap.phone && `Phone: ${nap.phone}`,
    nap.address && `Address: ${nap.address}, ${nap.city}`,
    nap.website && `Website: ${nap.website}`,
  ].filter(Boolean);
  const fullText = lines.join("\n");

  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "var(--space-2)",
        }}
      >
        <h3 className='heading-4' style={{ margin: 0 }}>
          NAP (use this exactly the same everywhere)
        </h3>
        <CopyButton text={fullText} label='Copy all' />
      </div>
      <p
        className='text-small'
        style={{
          color: "var(--text-secondary)",
          marginBottom: "var(--space-3)",
        }}
      >
        Inconsistent name, address, or phone across directories kills local
        rankings. Copy these values exactly — same punctuation, same spacing.
      </p>
      <pre
        style={{
          padding: "var(--space-3) var(--space-4)",
          background: "var(--surface2)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          whiteSpace: "pre-wrap",
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--text)",
          lineHeight: 1.6,
        }}
      >
        {fullText}
      </pre>
    </div>
  );
}

function DescriptionsBlock({ descriptions }: { descriptions: Descriptions }) {
  const items: { key: keyof Descriptions; label: string; cap: number }[] = [
    { key: "short", label: "Short (≤ 80 chars)", cap: 80 },
    { key: "medium", label: "Medium (≈ 250 chars)", cap: 250 },
    { key: "long", label: "Long (≈ 500 chars)", cap: 500 },
  ];
  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <h3 className='heading-4' style={{ marginBottom: "var(--space-2)" }}>
        Business descriptions
      </h3>
      <p
        className='text-small'
        style={{
          color: "var(--text-secondary)",
          marginBottom: "var(--space-3)",
        }}
      >
        Pick the version that fits each directory's character limit (shown on
        each row below).
      </p>
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {items.map(({ key, label, cap }) => {
          const text = descriptions[key];
          const over = text.length > cap;
          return (
            <div
              key={key}
              style={{
                padding: "var(--space-3) var(--space-4)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                background: "var(--surface)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "var(--space-2)",
                  marginBottom: "var(--space-2)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-secondary)",
                  }}
                >
                  {label} ·{" "}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: over
                        ? "var(--status-red)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {text.length} chars
                  </span>
                </span>
                <CopyButton text={text} />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-sm)",
                  color: "var(--text)",
                  lineHeight: 1.5,
                }}
              >
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pickDescription(
  charLimit: number,
  d: Descriptions,
): keyof Descriptions {
  if (charLimit >= 400 && d.long.length <= charLimit) return "long";
  if (charLimit >= 180 && d.medium.length <= charLimit) return "medium";
  return "short";
}

function DirectoryRow({
  dir,
  descriptions,
  checked,
  onToggle,
}: {
  dir: CitationDirectory;
  descriptions: Descriptions;
  checked: boolean;
  onToggle: () => void;
}) {
  const fitKey = pickDescription(dir.charLimit, descriptions);
  const fitText = descriptions[fitKey];

  return (
    <div
      style={{
        padding: "var(--space-3) var(--space-4)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        background: checked ? "var(--surface2)" : "var(--surface)",
        opacity: checked ? 0.7 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--space-3)",
        }}
      >
        <input
          type='checkbox'
          checked={checked}
          onChange={onToggle}
          style={{
            marginTop: "4px",
            width: "18px",
            height: "18px",
            accentColor: "var(--carolina)",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label={`Mark ${dir.name} as submitted`}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "var(--space-2)",
              flexWrap: "wrap",
              marginBottom: "var(--space-1)",
            }}
          >
            <a
              href={dir.url}
              target='_blank'
              rel='noopener noreferrer'
              style={{
                fontWeight: 600,
                color: "var(--text)",
                textDecoration: "none",
                fontSize: "var(--text-sm)",
              }}
            >
              {dir.name} ↗
            </a>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--text-secondary)",
              }}
            >
              {dir.charLimit} char limit · use {fitKey}
            </span>
          </div>
          <p
            style={{
              margin: "0 0 var(--space-2)",
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {dir.notes}
          </p>
          <CopyButton text={fitText} label={`Copy ${fitKey} description`} />
        </div>
      </div>
    </div>
  );
}
