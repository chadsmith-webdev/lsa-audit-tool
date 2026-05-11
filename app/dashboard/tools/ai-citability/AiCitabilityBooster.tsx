"use client";

import { useState } from "react";

type Faq = { q: string; a: string };
type ApiResponse = {
  schema: string;
  faqSchema: string;
  faqs: Faq[];
  entityBio: string;
  quotables: string[];
};

type Props = {
  auditId: string;
  defaultPhone?: string | null;
  defaultAddress?: string | null;
};

export default function AiCitabilityBooster({
  auditId,
  defaultPhone,
  defaultAddress,
}: Props) {
  const [services, setServices] = useState("");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [address, setAddress] = useState(defaultAddress ?? "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const list = services
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/tools/ai-citability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          services: list,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
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

  return (
    <section
      className='card card-default'
      style={{ padding: "var(--space-6)", marginTop: "var(--space-6)" }}
    >
      <header style={{ marginBottom: "var(--space-4)" }}>
        <h2 className='heading-3' style={{ marginBottom: "var(--space-1)" }}>
          AI Citability Booster
        </h2>
        <p
          className='text-small'
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          Schema, FAQ, and quotable facts tuned for ChatGPT, Perplexity, and
          Google AI Overviews. Paste these into your site so AI assistants pull
          your business name verbatim.
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
          label='Services (comma or newline separated)'
          hint='e.g. Drain cleaning, Water heater install, Sewer line repair'
        >
          <textarea
            value={services}
            onChange={(e) => setServices(e.target.value)}
            rows={3}
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
          <Field label='Phone' hint='Optional — used in schema'>
            <input
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='479-555-0100'
              style={inputStyle}
            />
          </Field>
          <Field label='Street address' hint='Optional — used in schema'>
            <input
              type='text'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='123 Main St'
              style={inputStyle}
            />
          </Field>
        </div>
      </div>

      <button
        type='button'
        onClick={handleGenerate}
        disabled={loading}
        className='btn btn-primary'
      >
        {loading
          ? "Generating…"
          : data
            ? "Regenerate"
            : "Generate citability assets"}
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
          <Block
            title='Entity bio'
            description='Paste this near the top of your homepage or About page. AI assistants will quote it verbatim when describing your business.'
            content={data.entityBio}
          />

          <Block
            title='LocalBusiness schema (JSON-LD)'
            description='Paste inside the <head> of your site. Tells search engines and AI exactly who you are.'
            content={data.schema}
            mono
          />

          <Block
            title='FAQ schema (JSON-LD)'
            description='Paste in <head> on your FAQ page or service pages. Eligible for Google AI Overviews and rich results.'
            content={data.faqSchema}
            mono
          />

          <div style={{ marginBottom: "var(--space-6)" }}>
            <h3
              className='heading-4'
              style={{ marginBottom: "var(--space-2)" }}
            >
              Visible FAQ block
            </h3>
            <p
              className='text-small'
              style={{
                color: "var(--text-secondary)",
                marginBottom: "var(--space-3)",
              }}
            >
              Add these as visible Q&amp;A on your page. Schema alone isn&apos;t
              enough — AI assistants prefer answers that are also human-readable
              on the page.
            </p>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {data.faqs.map((f, idx) => (
                <FaqCard key={idx} faq={f} />
              ))}
            </div>
          </div>

          <div>
            <h3
              className='heading-4'
              style={{ marginBottom: "var(--space-2)" }}
            >
              Quotable facts
            </h3>
            <p
              className='text-small'
              style={{
                color: "var(--text-secondary)",
                marginBottom: "var(--space-3)",
              }}
            >
              Sprinkle these as standalone sentences across your About,
              Services, and Contact pages. Each is short enough for an AI to
              quote whole.
            </p>
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              {data.quotables.map((q, idx) => (
                <QuotableRow key={idx} text={q} />
              ))}
            </div>
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <button type='button' onClick={handleCopy} className='btn btn-ghost btn-sm'>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Block({
  title,
  description,
  content,
  mono,
}: {
  title: string;
  description: string;
  content: string;
  mono?: boolean;
}) {
  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          marginBottom: "var(--space-2)",
        }}
      >
        <h3 className='heading-4' style={{ margin: 0 }}>
          {title}
        </h3>
        <CopyButton text={content} />
      </div>
      <p
        className='text-small'
        style={{
          color: "var(--text-secondary)",
          marginBottom: "var(--space-3)",
        }}
      >
        {description}
      </p>
      <pre
        style={{
          padding: "var(--space-3) var(--space-4)",
          background: "var(--surface2)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          fontSize: mono ? "var(--text-xs)" : "var(--text-sm)",
          color: "var(--text)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {content}
      </pre>
    </div>
  );
}

function FaqCard({ faq }: { faq: Faq }) {
  return (
    <div
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
          gap: "var(--space-3)",
          marginBottom: "var(--space-2)",
        }}
      >
        <p
          style={{
            fontWeight: 600,
            color: "var(--text)",
            margin: 0,
            fontSize: "var(--text-sm)",
          }}
        >
          {faq.q}
        </p>
        <CopyButton text={`Q: ${faq.q}\nA: ${faq.a}`} />
      </div>
      <p
        style={{
          color: "var(--text-secondary)",
          margin: 0,
          fontSize: "var(--text-sm)",
          lineHeight: 1.5,
        }}
      >
        {faq.a}
      </p>
    </div>
  );
}

function QuotableRow({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-2) var(--space-3)",
        background: "var(--surface2)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <p
        style={{
          margin: 0,
          flex: 1,
          fontSize: "var(--text-sm)",
          color: "var(--text)",
          lineHeight: 1.5,
        }}
      >
        {text}
      </p>
      <CopyButton text={text} />
    </div>
  );
}
