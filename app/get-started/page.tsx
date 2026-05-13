import Link from "next/link";
import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import landingStyles from "@/styles/landing.module.css";
import styles from "@/styles/get-started.module.css";

export const metadata = {
  title: "Get Started Free — Local Search Ally",
  description:
    "Run a free local SEO audit in 90 seconds. See exactly where Google isn't showing your business — then use 8 AI-powered tools to fix the gaps yourself.",
};

const STEPS = [
  {
    n: "01",
    title: "Run the audit",
    body: "Enter your business name and city. The audit checks your GBP, reviews, citations, backlinks, website, and competitor rankings — all in about 90 seconds.",
  },
  {
    n: "02",
    title: "See your score",
    body: "You get a plain-English breakdown: what's working, what's hurting you, and the three highest-impact things to fix first.",
  },
  {
    n: "03",
    title: "Fix the gaps",
    body: "Eight tools map to every section in your audit. Work through them yourself at your own pace — or book a call if you'd rather hand it off.",
  },
];

const TOOLS = [
  {
    n: "01",
    name: "GBP Optimizer",
    description:
      "Walks through every GBP field that affects where you rank in the Map Pack. Flags what's missing, buried, or wrong.",
  },
  {
    n: "02",
    name: "Review Engine",
    description:
      "Builds a system for getting more reviews and responding to them. Templates included — nothing to figure out from scratch.",
  },
  {
    n: "03",
    name: "Citation Builder",
    description:
      "Finds where your business name, address, and phone are inconsistent across directories. Inconsistency is one of the three biggest local ranking killers.",
  },
  {
    n: "04",
    name: "Backlink Outreach",
    description:
      "Identifies local link opportunities — chambers, directories, local press — and tracks your domain authority over time.",
  },
  {
    n: "05",
    name: "On-Page Fixer",
    description:
      "Checks your service pages for local keyword relevance, heading structure, and schema. The signals Google reads to decide if your site is relevant.",
  },
  {
    n: "06",
    name: "AI Citability Booster",
    description:
      "Checks whether AI tools like ChatGPT and Perplexity mention your business for local searches. 45% of consumers now use AI for local recommendations.",
  },
  {
    n: "07",
    name: "Technical Monitor",
    description:
      "Tracks Core Web Vitals, crawl errors, and mobile issues that quietly suppress rankings without triggering any obvious red flags.",
  },
  {
    n: "08",
    name: "Competitor Watch",
    description:
      "Shows how the businesses outranking you are set up — their GBP, review count, and citations — so you know exactly what you're up against.",
  },
];

export default function GetStartedPage() {
  return (
    <>
      <SiteNavMinimal />
      <main
        className={landingStyles.mainContent}
        style={{ background: "var(--bg)", minHeight: "100vh" }}
      >
        {/* ─── Hero ─────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Free tools for NWA home service trades</span>
          <h1 className={`heading-1 ${styles.heroHeading}`}>
            Find out where Google is hiding your business — then fix it yourself.
          </h1>
          <p className={styles.heroSub}>
            Run a free audit in 90 seconds. Get a scored breakdown of every
            factor keeping you out of the Map Pack — then use 8 AI-powered
            tools to fix the gaps. No agency. No contract. No credit card to
            start.
          </p>
          <div className={styles.heroCtas}>
            <Link href='/' className='btn btn-primary btn-lg'>
              Run your free audit →
            </Link>
            <p className={styles.heroNote}>
              Takes 90 seconds &middot; No credit card &middot; Full results, no email gate
            </p>
          </div>
        </section>

        {/* ─── How it works ──────────────────────────────────────────────── */}
        <section className={styles.section}>
          <span className={styles.eyebrow}>How it works</span>
          <h2 className={`heading-2 ${styles.sectionHeading}`}>
            Three steps. No guesswork.
          </h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((step) => (
              <div key={step.n} className={styles.stepCard}>
                <span className={styles.stepNumber}>{step.n}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Tools ─────────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <span className={styles.eyebrow}>The toolkit</span>
          <h2 className={`heading-2 ${styles.sectionHeading}`}>
            Eight tools. Every gap in your audit has one mapped to it.
          </h2>
          <div className={styles.toolsGrid}>
            {TOOLS.map((tool) => (
              <div key={tool.name} className={styles.toolCard}>
                <div className={styles.toolHeader}>
                  <span className={styles.toolNumber}>{tool.n}</span>
                  <span className={styles.toolName}>{tool.name}</span>
                </div>
                <p className={styles.toolDesc}>{tool.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pricing anchor ────────────────────────────────────────────── */}
        <section className={styles.section}>
          <span className={styles.eyebrow}>Pricing</span>
          <h2 className={`heading-2 ${styles.sectionHeading}`}>
            Start free. Upgrade when it pays for itself.
          </h2>
          <div className={styles.pricingRow}>
            <div className={styles.pricingCard}>
              <div>
                <p className={styles.pricingTier}>Free</p>
                <p className={styles.pricingPrice}>
                  $0 <span>forever</span>
                </p>
              </div>
              <ul className={styles.pricingList}>
                <li>Free local SEO audit</li>
                <li>Full score breakdown</li>
                <li>Competitor names</li>
                <li>All 8 tools locked (preview only)</li>
              </ul>
              <Link
                href='/'
                className='btn btn-secondary'
                style={{ width: "100%", justifyContent: "center" }}
              >
                Run free audit
              </Link>
            </div>

            <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
              <div>
                <p className={styles.pricingTier}>Pro</p>
                <p className={styles.pricingPrice}>
                  $49 <span>/ month</span>
                </p>
                <p className={styles.pricingPriceSub}>
                  or $36/mo billed annually · save $156/yr
                </p>
              </div>
              <ul className={styles.pricingList}>
                <li>Everything in Free</li>
                <li>All 8 tools unlocked</li>
                <li>Geo-grid rank tracking</li>
                <li>Unlimited audits + history</li>
              </ul>
              <div className={styles.pricingCtas}>
                <Link
                  href='/pricing'
                  className='btn btn-primary'
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  See full pricing →
                </Link>
                <p className={styles.pricingNote}>14-day free trial available</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Bottom CTA ────────────────────────────────────────────────── */}
        <section className={styles.bottomCta}>
          <h2 className={`heading-2 ${styles.bottomCtaHeading}`}>
            Run the free audit. If you don&apos;t see at least three things to
            fix, you don&apos;t need this.
          </h2>
          <Link href='/' className='btn btn-primary btn-lg'>
            Run your free audit →
          </Link>
        </section>

        <div style={{ height: "var(--space-16)" }} aria-hidden='true' />
      </main>
      <SiteFooterMinimal />
    </>
  );
}
