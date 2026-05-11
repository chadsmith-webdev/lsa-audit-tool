"use client";

import { useState } from "react";
import Link from "next/link";
import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import landingStyles from "@/styles/landing.module.css";

type Billing = "monthly" | "annual";

const TOOLS = [
  "GBP Optimizer",
  "Review Engine",
  "Citation Builder",
  "Backlink Outreach",
  "On-Page Fixer",
  "AI Citability Booster",
  "Technical Monitor",
  "Competitor Watch",
];

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <>
      <SiteNavMinimal />
      <main
        className={landingStyles.mainContent}
        style={{ background: "var(--bg)", minHeight: "100vh" }}
      >
        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "var(--space-10) var(--page-gutter) var(--space-8)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--carolina)",
              marginBottom: "var(--space-3)",
            }}
          >
            Pricing
          </span>
          <h1
            className='heading-1'
            style={{
              marginBottom: "var(--space-3)",
              maxWidth: "720px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            One service call covers a whole year of better leads.
          </h1>
          <p
            className='text-md'
            style={{
              color: "var(--text-secondary)",
              maxWidth: "640px",
              margin: "0 auto var(--space-6)",
              lineHeight: 1.5,
            }}
          >
            Built for NWA contractors. Audit your local search presence, then
            use 8 AI-powered tools to fix what&apos;s broken — no agency
            required.
          </p>

          <BillingToggle billing={billing} onChange={setBilling} />
        </section>

        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 var(--page-gutter) var(--space-10)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "var(--space-5)",
              alignItems: "stretch",
            }}
          >
            <PlanCard
              tier='Free'
              priceLabel='$0'
              cadence='forever'
              tagline='See what&rsquo;s broken. Fix it yourself.'
              features={[
                "1 saved audit",
                "GBP, citations, reviews score",
                "Competitor names list",
                "Grid view locked",
                "All 8 Pro Tools locked (preview only)",
              ]}
              cta={{ label: "Run free audit", href: "/" }}
              variant='default'
            />

            <PlanCard
              tier='Pro'
              priceLabel={billing === "annual" ? "$36" : "$49"}
              cadence='per month'
              priceSub={
                billing === "annual"
                  ? "$432 billed yearly · save $156"
                  : "billed monthly"
              }
              tagline='The full toolkit for one local business.'
              features={[
                "Unlimited audits + full history",
                "All 8 Pro Tools unlocked",
                "Grid view rank tracking",
                "Audit PDF export",
                "Email support",
              ]}
              cta={{
                label: "Start 14-day free trial",
                href: `/signup?plan=pro&billing=${billing}`,
              }}
              variant='featured'
              ribbon='Most popular'
              earlyAdopter={billing === "annual"}
            />

            <PlanCard
              tier='Multi-Location'
              priceLabel={billing === "annual" ? "$149" : "$199"}
              cadence='per month'
              priceSub={
                billing === "annual"
                  ? "$1,788 billed yearly · save $600"
                  : "billed monthly"
              }
              tagline='For operators managing multiple locations.'
              features={[
                "Everything in Pro",
                "Up to 10 locations",
                "White-label PDF exports",
                "Priority support",
                "1:1 onboarding call",
              ]}
              cta={{
                label: "Start 14-day free trial",
                href: `/signup?plan=multi_location&billing=${billing}`,
              }}
              variant='default'
            />
          </div>
        </section>

        <ToolsRail />

        <ComparisonTable />

        <FAQSection />

        <section
          style={{
            maxWidth: "780px",
            margin: "0 auto",
            padding: "var(--space-10) var(--page-gutter) var(--space-12)",
            textAlign: "center",
          }}
        >
          <h2 className='heading-2' style={{ marginBottom: "var(--space-3)" }}>
            Still on the fence?
          </h2>
          <p
            className='text-md'
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-5)",
              lineHeight: 1.5,
            }}
          >
            Run the free audit. If you don&apos;t see at least three concrete
            things to fix, you don&apos;t need us.
          </p>
          <Link href='/' className='btn btn-primary'>
            Run a free audit →
          </Link>
        </section>
      </main>
      <SiteFooterMinimal />
    </>
  );
}

/* ─── Billing toggle ───────────────────────────────────────────────────── */

function BillingToggle({
  billing,
  onChange,
}: {
  billing: Billing;
  onChange: (b: Billing) => void;
}) {
  return (
    <div
      role='radiogroup'
      aria-label='Billing period'
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "4px",
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: "999px",
      }}
    >
      <ToggleButton
        active={billing === "monthly"}
        onClick={() => onChange("monthly")}
        label='Monthly'
      />
      <ToggleButton
        active={billing === "annual"}
        onClick={() => onChange("annual")}
        label='Annual'
        badge='3 months free'
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "8px 18px",
        borderRadius: "999px",
        background: active ? "var(--carolina)" : "transparent",
        color: active ? "var(--bg)" : "var(--text-secondary)",
        border: "none",
        cursor: "pointer",
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        transition: "all 160ms ease",
      }}
    >
      {label}
      {badge && (
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontFamily: "var(--font-mono)",
            padding: "2px 8px",
            borderRadius: "999px",
            background: active
              ? "rgba(10, 10, 10, 0.15)"
              : "var(--status-green-dim)",
            color: active ? "var(--bg)" : "var(--status-green)",
            border: active
              ? "1px solid rgba(10,10,10,0.2)"
              : "1px solid var(--status-green-mid)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/* ─── Plan card ────────────────────────────────────────────────────────── */

function PlanCard({
  tier,
  priceLabel,
  cadence,
  priceSub,
  tagline,
  features,
  cta,
  variant,
  ribbon,
  earlyAdopter,
}: {
  tier: string;
  priceLabel: string;
  cadence: string;
  priceSub?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  variant: "default" | "featured";
  ribbon?: string;
  earlyAdopter?: boolean;
}) {
  const featured = variant === "featured";
  return (
    <div
      style={{
        position: "relative",
        padding: "var(--space-6)",
        background: featured ? "var(--surface2)" : "var(--surface)",
        border: featured
          ? "1px solid var(--border-accent)"
          : "1px solid var(--border-strong)",
        borderRadius: "var(--radius-lg)",
        boxShadow: featured
          ? "0 0 0 1px var(--carolina-mid), 0 12px 32px rgba(0,0,0,0.35)"
          : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {ribbon && (
        <span
          style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "var(--text-xs)",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            padding: "4px 12px",
            background: "var(--carolina)",
            color: "var(--bg)",
            borderRadius: "999px",
          }}
        >
          {ribbon}
        </span>
      )}

      <header style={{ marginBottom: "var(--space-4)" }}>
        <p
          className='label'
          style={{
            color: "var(--text-secondary)",
            marginBottom: "var(--space-2)",
          }}
        >
          {tier}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "var(--space-2)",
            marginBottom: "var(--space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-2xl)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              lineHeight: 1,
              color: "var(--text)",
            }}
          >
            {priceLabel}
          </span>
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            {cadence}
          </span>
        </div>
        {priceSub && (
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              color: featured ? "var(--carolina)" : "var(--muted)",
            }}
          >
            {priceSub}
          </p>
        )}
        <p
          style={{
            marginTop: "var(--space-3)",
            marginBottom: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          {tagline}
        </p>
      </header>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
      >
        {features.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-2)",
              fontSize: "var(--text-sm)",
              color: "var(--text)",
              lineHeight: 1.4,
            }}
          >
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "var(--space-5)" }}>
        <Link
          href={cta.href}
          className={featured ? "btn btn-primary" : "btn btn-secondary"}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {cta.label}
        </Link>
        {earlyAdopter && (
          <p
            style={{
              marginTop: "var(--space-2)",
              marginBottom: 0,
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              color: "var(--carolina)",
              textAlign: "center",
            }}
          >
            Early adopter price · locked for life
          </p>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      aria-hidden='true'
      style={{
        marginTop: "3px",
        color: "var(--carolina)",
        flexShrink: 0,
      }}
    >
      <path
        d='M3 8.5l3.5 3.5 7-8'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

/* ─── Tools rail ───────────────────────────────────────────────────────── */

function ToolsRail() {
  return (
    <section
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "var(--space-8) var(--page-gutter)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <p
        className='label'
        style={{
          color: "var(--carolina)",
          marginBottom: "var(--space-3)",
          textAlign: "center",
        }}
      >
        Included in Pro · 8 tools
      </p>
      <h2
        className='heading-3'
        style={{
          textAlign: "center",
          marginBottom: "var(--space-6)",
        }}
      >
        Everything you need to outrank the shop down the street.
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        {TOOLS.map((t, i) => (
          <div
            key={t}
            style={{
              padding: "var(--space-3) var(--space-4)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--muted)",
                minWidth: "20px",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text)" }}>
              {t}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Comparison table ─────────────────────────────────────────────────── */

function ComparisonTable() {
  const rows: Array<[string, string, string, string]> = [
    ["Saved audits", "1", "Unlimited", "Unlimited"],
    ["Locations", "1", "1", "Up to 10"],
    ["All 8 Pro Tools", "—", "✓", "✓"],
    ["Grid rank tracking", "—", "✓", "✓"],
    ["PDF export", "—", "Standard", "White-label"],
    ["Support", "Email", "Email", "Priority + 1:1"],
  ];
  return (
    <section
      style={{
        maxWidth: "880px",
        margin: "0 auto",
        padding: "var(--space-8) var(--page-gutter)",
      }}
    >
      <h2
        className='heading-3'
        style={{
          textAlign: "center",
          marginBottom: "var(--space-5)",
        }}
      >
        Compare plans
      </h2>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "var(--text-sm)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              <th style={thStyle}></th>
              <th style={thStyle}>Free</th>
              <th style={{ ...thStyle, color: "var(--carolina)" }}>Pro</th>
              <th style={thStyle}>Multi-Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, free, pro, multi]) => (
              <tr key={label} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={tdLabel}>{label}</td>
                <td style={tdCell}>{free}</td>
                <td
                  style={{ ...tdCell, color: "var(--text)", fontWeight: 600 }}
                >
                  {pro}
                </td>
                <td style={tdCell}>{multi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const thStyle: React.CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  textAlign: "left",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-secondary)",
  fontWeight: 700,
};

const tdLabel: React.CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  color: "var(--text-secondary)",
  fontWeight: 500,
};

const tdCell: React.CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  color: "var(--text-secondary)",
};

/* ─── FAQ ──────────────────────────────────────────────────────────────── */

function FAQSection() {
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "Do I need a credit card to start the free trial?",
      a: "Yes — you authorize a subscription through PayPal but you aren't charged for 14 days. Cancel anytime before day 14 and you pay nothing.",
    },
    {
      q: "What happens after the trial?",
      a: "On day 15 your card is charged for the plan you picked. If you cancel before then, your account drops back to Free with your audit history intact.",
    },
    {
      q: "Can I switch plans later?",
      a: "Yes. Upgrade from Pro to Multi-Location anytime. Downgrades take effect at the end of your current billing period.",
    },
    {
      q: "Is the early adopter price really locked for life?",
      a: "Yes. As long as your annual Pro subscription stays active, your renewal price never goes up — even when we raise prices for new customers.",
    },
    {
      q: "What if I only need to run a few audits?",
      a: "Then stick with Free. The audit itself is free forever. Pro is for contractors who want the AI-powered fix tools.",
    },
    {
      q: "Do you offer refunds?",
      a: "If something breaks or you're not getting value in the first 30 days of a paid month, email us and we'll refund you. No forms, no scripts.",
    },
  ];
  return (
    <section
      style={{
        maxWidth: "780px",
        margin: "0 auto",
        padding: "var(--space-8) var(--page-gutter)",
      }}
    >
      <h2
        className='heading-3'
        style={{
          textAlign: "center",
          marginBottom: "var(--space-5)",
        }}
      >
        Questions, answered straight.
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {faqs.map((f) => (
          <details
            key={f.q}
            style={{
              padding: "var(--space-4) var(--space-5)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: "var(--text)",
                fontSize: "var(--text-base)",
                listStyle: "none",
              }}
            >
              {f.q}
            </summary>
            <p
              style={{
                marginTop: "var(--space-2)",
                marginBottom: 0,
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
