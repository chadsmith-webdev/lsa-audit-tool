"use client";

import { useState } from "react";
import Link from "next/link";
import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import landingStyles from "@/styles/landing.module.css";
import styles from "@/styles/pricing.module.css";

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

// Maps the `?gate=<slug>` value from requireProAccess() to a friendly tool name.
// Accepts both UpgradeSlot's slug (ai-visibility) and the tool route slug
// (ai-citability) so either source can deep-link here.
const GATE_TOOL_NAMES: Record<string, string> = {
  gbp: "GBP Optimizer",
  reviews: "Review Engine",
  citations: "Citation Builder",
  competitors: "Competitor Watch",
  backlinks: "Backlink Outreach",
  onpage: "On-Page Fixer",
  technical: "Technical Monitor",
  "ai-visibility": "AI Citability Booster",
  "ai-citability": "AI Citability Booster",
};

export default function PricingPage({
  gate,
  cancelled,
  error,
}: {
  gate?: string | null;
  cancelled?: boolean;
  error?: string | null;
}) {
  const [billing, setBilling] = useState<Billing>("annual");

  const banner = (() => {
    if (cancelled) {
      return {
        tone: "neutral" as const,
        title: "Trial signup cancelled",
        body: "No worries — nothing was charged. Start the 14-day free trial whenever you’re ready.",
      };
    }
    if (error === "missing_sub") {
      return {
        tone: "error" as const,
        title: "Something went sideways with PayPal",
        body: "We didn’t get a subscription back. Try the free trial again — and if it keeps happening, email chad@localsearchally.com.",
      };
    }
    if (gate) {
      const toolName = gate === "1" ? null : (GATE_TOOL_NAMES[gate] ?? null);
      return {
        tone: "highlight" as const,
        title: toolName
          ? `${toolName} is a Pro tool`
          : "That tool is part of Pro",
        body: toolName
          ? `Start your 14-day free trial to unlock ${toolName} and the rest of the toolkit.`
          : "Start your 14-day free trial to unlock the full toolkit.",
      };
    }
    return null;
  })();

  return (
    <>
      <SiteNavMinimal />
      <main
        className={landingStyles.mainContent}
        style={{ background: "var(--bg)", minHeight: "100vh" }}
      >
        {banner && (
          <div
            role='status'
            aria-live='polite'
            style={{
              maxWidth: "1100px",
              margin: "var(--space-6) auto 0",
              padding: "0 var(--page-gutter)",
            }}
          >
            <div
              style={{
                padding: "var(--space-4) var(--space-5)",
                borderRadius: "var(--radius-md)",
                border:
                  banner.tone === "error"
                    ? "1px solid var(--danger, #c0392b)"
                    : banner.tone === "highlight"
                      ? "1px solid var(--border-accent)"
                      : "1px solid var(--border-strong)",
                background:
                  banner.tone === "highlight"
                    ? "var(--carolina-dim)"
                    : "var(--surface)",
                display: "flex",
                gap: "var(--space-3)",
                alignItems: "flex-start",
              }}
            >
              <span
                aria-hidden='true'
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  lineHeight: 1.5,
                  color:
                    banner.tone === "error"
                      ? "var(--danger, #c0392b)"
                      : "var(--carolina)",
                  flexShrink: 0,
                }}
              >
                {banner.tone === "error"
                  ? "Error"
                  : banner.tone === "highlight"
                    ? "Pro tool"
                    : "Cancelled"}
              </span>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {banner.title}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {banner.body}
                </p>
              </div>
            </div>
          </div>
        )}
        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: `${banner ? "var(--space-10)" : "var(--space-16)"} var(--page-gutter) var(--space-12)`,
            textAlign: "center",
          }}
        >
          <span className={styles.eyebrow}>Pricing · 2026</span>
          <h1
            className='heading-1'
            style={{
              margin: "var(--space-4) auto var(--space-6)",
              textWrap: "balance",
              maxWidth: "20ch",
            }}
          >
            One service call covers a whole year of better leads.
          </h1>
          <p
            style={{
              fontSize: "var(--text-md)",
              color: "var(--text-secondary)",
              margin: "0 auto",
              maxWidth: "560px",
              lineHeight: 1.6,
            }}
          >
            Built for NWA contractors. Find exactly where Google isn&apos;t
            showing you — then use 8 AI-powered tools to fix it yourself, no
            agency needed.
          </p>
          <div
            style={{
              marginTop: "var(--space-10)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <BillingToggle billing={billing} onChange={setBilling} />
          </div>
        </section>

        <div className={styles.tileWrap}>
          <section
            style={{
              padding: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "var(--space-6)",
                alignItems: "stretch",
              }}
            >
              <PlanCard
                tier='Free'
                priceLabel='$0'
                cadence='forever'
                tagline='See where you stand. No credit card.'
                features={[
                  "Free local SEO audit",
                  "Dashboard with your score + GBP, citations, reviews",
                  "Competitor names list",
                  "Grid rank tracking locked",
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
                tagline='Fix what the audit finds — all 8 tools, one monthly cost.'
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
                tagline='One dashboard for every location you run.'
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

          <ManagedServices />

          <FAQSection />

          <section
            className={`${styles.tile} ${styles.tileFeatured} ${styles.tileCentered}`}
          >
            <span className={styles.eyebrow}>Ready?</span>
            <h2
              className='heading-2'
              style={{
                margin: "var(--space-3) 0 var(--space-3)",
                textWrap: "balance",
              }}
            >
              Still on the fence?
            </h2>
            <p
              style={{
                fontSize: "var(--text-md)",
                color: "var(--text-secondary)",
                margin: "0 auto var(--space-6)",
                lineHeight: 1.55,
                maxWidth: "480px",
              }}
            >
              Run the free audit. If you don&apos;t see at least three concrete
              things to fix, you don&apos;t need us.
            </p>
            <Link href='/' className='btn btn-primary'>
              Run a free audit →
            </Link>
          </section>
        </div>
        <div style={{ height: "calc(var(--space-16) * 2)" }} aria-hidden='true' />
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
      className={`${styles.toggleBtn} ${active ? styles.toggleBtnActive : ""}`}
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
              ? "color-mix(in srgb, var(--bg) 18%, transparent)"
              : "var(--status-green-dim)",
            color: active ? "var(--bg)" : "var(--status-green)",
            border: active
              ? "1px solid color-mix(in srgb, var(--bg) 25%, transparent)"
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
      className={`${styles.planCard} ${featured ? styles.planCardFeatured : ""}`}
      style={{
        position: "relative",
        padding: "var(--space-8)",
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

      <header style={{ marginBottom: "var(--space-6)" }}>
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
        {priceSub ? (
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              color: featured ? "var(--carolina)" : "var(--muted)",
              minHeight: "1.4em",
            }}
          >
            {priceSub}
          </p>
        ) : (
          <p
            aria-hidden='true'
            style={{
              margin: 0,
              fontSize: "var(--text-xs)",
              minHeight: "1.4em",
            }}
          />
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
          gap: "var(--space-3)",
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
              lineHeight: 1.5,
            }}
          >
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "var(--space-8)" }}>
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
        color: "var(--carolina)",
        flexShrink: 0,
        transform: "translateY(0.2em)",
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
    <section className={`${styles.tile} ${styles.tileAlt}`}>
      <span className={styles.eyebrow}>Toolkit</span>
      <h2
        className='heading-3'
        style={{
          margin: "var(--space-3) 0 var(--space-8)",
          textWrap: "balance",
        }}
      >
        Everything you need to outrank the shop down the street.
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {TOOLS.map((t, i) => (
          <div
            key={t}
            style={{
              padding: "var(--space-4) var(--space-5)",
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
    ["Local SEO audit", "✓", "✓ unlimited", "✓ unlimited"],
    ["Dashboard", "✓", "✓", "✓"],
    ["Locations", "1", "1", "Up to 10"],
    ["All 8 Pro Tools", "—", "✓", "✓"],
    ["Grid rank tracking", "—", "✓", "✓"],
    ["PDF export", "—", "Standard", "White-label"],
    ["Support", "Email", "Email", "Priority + 1:1"],
  ];
  return (
    <section className={styles.tile}>
      <span className={styles.eyebrow}>Compare</span>
      <h2
        className='heading-3'
        style={{ margin: "var(--space-3) 0 var(--space-8)" }}
      >
        Compare plans
      </h2>
      <div
        style={{
          background: "var(--bg)",
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
              <th scope='col' style={thStyle}>
                <span
                  style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                  }}
                >
                  Feature
                </span>
              </th>
              <th scope='col' style={thStyle}>
                Free
              </th>
              <th
                scope='col'
                style={{
                  ...thStyle,
                  color: "var(--carolina)",
                  background: "var(--carolina-dim)",
                }}
              >
                Pro
              </th>
              <th scope='col' style={thStyle}>
                Multi-Location
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, free, pro, multi]) => (
              <tr key={label} style={{ borderTop: "1px solid var(--border)" }}>
                <th scope='row' style={tdLabel}>
                  {label}
                </th>
                <td style={tdCell}>{free}</td>
                <td
                  style={{
                    ...tdCell,
                    color: "var(--text)",
                    fontWeight: 600,
                    background: "var(--carolina-dim)",
                  }}
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
  padding: "var(--space-4) var(--space-5)",
  textAlign: "left",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-secondary)",
  fontWeight: 700,
};

const tdLabel: React.CSSProperties = {
  padding: "var(--space-4) var(--space-5)",
  color: "var(--text-secondary)",
  fontWeight: 500,
  textAlign: "left",
};

const tdCell: React.CSSProperties = {
  padding: "var(--space-4) var(--space-5)",
  color: "var(--text-secondary)",
};
/* ─── Managed services panel ───────────────────────────────────── */

function ManagedServices() {
  return (
    <section className={`${styles.tile} ${styles.tileAlt}`}>
      <span className={styles.eyebrow}>Done-for-you</span>
      <h2
        className='heading-3'
        style={{
          margin: "var(--space-3) 0 var(--space-8)",
          textWrap: "balance",
        }}
      >
        Prefer to hand it off?
      </h2>
      <div className={styles.managedPanel}>
        <div>
          <p
            style={{
              margin: "0 0 var(--space-5)",
              color: "var(--text-secondary)",
              fontSize: "var(--text-md)",
              lineHeight: 1.55,
              maxWidth: "520px",
            }}
          >
            I&apos;ll handle your local SEO end-to-end — audits, fixes,
            citations, reviews, content. You stay on the truck.
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 var(--space-8)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3) var(--space-6)",
              fontSize: "var(--text-sm)",
              color: "var(--text)",
            }}
          >
            {[
              "Monthly audits & reporting",
              "GBP managed for you",
              "Review responses handled",
              "Citation cleanup",
              "Content posted weekly",
              "Dedicated point of contact",
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-2)",
                  lineHeight: 1.5,
                }}
              >
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href='https://www.localsearchally.com/contact'
            className='btn btn-primary'
            style={{ alignSelf: "flex-start" }}
            target='_blank'
            rel='noopener noreferrer'
          >
            Book a free consult →
          </Link>
        </div>
        <aside className={styles.managedAside}>
          <span className={styles.managedTag} aria-hidden='true'>
            §— By inquiry
          </span>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              lineHeight: 1,
              fontWeight: 700,
              margin: "var(--space-4) 0 var(--space-3)",
              color: "var(--text)",
            }}
          >
            Custom
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Pricing depends on your locations, competition, and how much I take
            off your plate. 30-minute call, no pressure.
          </p>
        </aside>
      </div>
    </section>
  );
}
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
      a: "Yes. As long as your annual Pro subscription stays active, your renewal price never goes up — even when I raise prices for new customers.",
    },
    {
      q: "What if I only need to run a few audits?",
      a: "Then stick with Free. The audit itself is free forever. Pro is for contractors who want the AI-powered fix tools.",
    },
    {
      q: "Do you offer refunds?",
      a: "If something breaks or you're not getting value in the first 30 days of a paid month, email me and I'll refund you. No forms, no scripts.",
    },
  ];
  return (
    <section className={styles.tile}>
      <span className={styles.eyebrow}>FAQ</span>
      <h2
        className='heading-3'
        style={{ margin: "var(--space-3) 0 var(--space-8)" }}
      >
        Questions, answered straight.
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        {faqs.map((f) => (
          <details
            key={f.q}
            className={styles.faqItem}
            style={{
              padding: "var(--space-5) var(--space-6)",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <summary className={styles.faqSummary}>
              <span>{f.q}</span>
              <svg
                className={styles.faqIcon}
                viewBox='0 0 14 14'
                aria-hidden='true'
              >
                <path
                  d='M7 1v12M1 7h12'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  fill='none'
                />
              </svg>
            </summary>
            <p
              style={{
                marginTop: "var(--space-3)",
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
