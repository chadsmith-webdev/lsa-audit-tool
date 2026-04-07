import type { Metadata } from "next";
import AuditTool from "@/app/components/AuditTool";
import SiteNav from "@/app/components/SiteNav";
import SiteFooter from "@/app/components/SiteFooter";
import styles from "@/styles/landing.module.css";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Free Local SEO Audit for Contractors | Local Search Ally",
  description:
    "See exactly how your business shows up in Google — GBP, reviews, on-page SEO, citations, and more. Free AI-powered audit for NWA contractors. Results in 90 seconds.",
  alternates: {
    canonical: "https://localsearchally.com/free-local-seo-audit",
  },
  openGraph: {
    title: "Free Local SEO Audit for Contractors | Local Search Ally",
    description:
      "See exactly how your business shows up in Google. Real data. 90 seconds. Free.",
    url: "https://localsearchally.com/free-local-seo-audit",
    type: "website",
  },
};

// ─── Structured data ──────────────────────────────────────────────────────────

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Local SEO Audit Tool",
  description:
    "Free AI-powered local SEO audit for contractors. Checks Google Business Profile, reviews, on-page SEO, technical SEO, citations, backlinks, and competitors in 90 seconds.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  provider: {
    "@type": "LocalBusiness",
    name: "Local Search Ally",
    url: "https://localsearchally.com",
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Northwest Arkansas",
    },
  },
  featureList: [
    "Google Business Profile audit",
    "Review analysis",
    "On-page SEO check",
    "Technical SEO analysis",
    "Citation consistency check",
    "Backlink analysis",
    "Competitor comparison",
    "Shareable audit URL",
    "PDF report",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FreeLocalSEOAuditPage() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <SiteNav />

      <main className={styles.mainContent}>
        {/* Hero + Tool — two-column above the fold */}
        <header className={styles.heroRow} id='top'>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>FREE TOOL · LSA</span>
            <h1 className={styles.heroTitle}>
              See Exactly How Your Business
              <br />
              Shows Up in <span className={styles.heroAccent}>Google</span>
            </h1>
            <p className={styles.heroSub}>
              Enter your business info. Get a real audit in 90 seconds.
            </p>
            <div className={styles.heroPills}>
              <span className={styles.heroPill}>Free · No Email Required</span>
              <span className={styles.heroPill}>Results in 90 Seconds</span>
              <span className={styles.heroPill}>AI-Powered Research</span>
            </div>
          </div>
          <div className={styles.heroTool}>
            <AuditTool />
          </div>
        </header>

        {/* What the audit checks */}
        <section className={styles.section} aria-labelledby='checks-heading'>
          <p className={styles.sectionLabel}>DIAGNOSTIC · 7 FACTORS</p>
          <h2 className={styles.sectionTitle} id='checks-heading'>
            7 factors that determine
            <br />
            whether customers find you
          </h2>
          <p className={styles.sectionBody}>
            The audit researches your actual online presence using live web data
            — not guesses. Every section gets a score, a plain-English finding,
            and a specific next step.
          </p>
          <div className={styles.diagnosticList}>
            {AUDIT_CHECKS.map((c, i) => (
              <div key={c.name} className={styles.diagnosticRow}>
                <span className={styles.diagnosticIdx} aria-hidden='true'>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={styles.diagnosticContent}>
                  <p className={styles.diagnosticName}>{c.name}</p>
                  <p className={styles.diagnosticDesc}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why contractors use it */}
        <section className={styles.section} aria-labelledby='why-heading'>
          <p className={styles.sectionLabel}>WHY IT WORKS</p>
          <h2 className={styles.sectionTitle} id='why-heading'>
            Why NWA contractors use it
          </h2>
          <div className={styles.reasons}>
            {REASONS.map((r, i) => (
              <div key={i} className={styles.reasonItem}>
                <span className={styles.reasonNum} aria-hidden='true'>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={styles.reasonText}>
                  <p className={styles.reasonTitle}>{r.title}</p>
                  <p className={styles.reasonBody}>{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What you get */}
        <section className={styles.section} aria-labelledby='get-heading'>
          <p className={styles.sectionLabel}>YOUR REPORT</p>
          <h2 className={styles.sectionTitle} id='get-heading'>
            A complete picture of your
            <br />
            local search presence
          </h2>
          <ul className={styles.getList} role='list'>
            {GET_ITEMS.map((item, i) => (
              <li key={i} className={styles.getItem}>
                <span className={styles.getCheck} aria-hidden='true'>
                  <svg
                    width='10'
                    height='10'
                    viewBox='0 0 12 12'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <polyline points='2 6 5 9 10 3' />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className={styles.section} aria-labelledby='faq-heading'>
          <p className={styles.sectionLabel}>FAQ · COMMON QUESTIONS</p>
          <h2 className={styles.sectionTitle} id='faq-heading'>
            Frequently asked questions
          </h2>
          <div className={styles.faqList}>
            {FAQS.map((faq, i) => (
              <details key={i} className={styles.faqItem}>
                <summary className={styles.faqQ}>{faq.q}</summary>
                <p className={styles.faqA}>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* CTA section */}
      <section className={styles.footerCta} aria-labelledby='cta-heading'>
        <p className={styles.footerCtaTitle} id='cta-heading'>
          Ready to see where you stand?
        </p>
        <p className={styles.footerCtaSub}>
          Free. No signup. Results in 90 seconds.
        </p>
        <a href='#top' className={styles.ctaBtn}>
          Run My Free Audit →
        </a>
      </section>

      <SiteFooter />
    </>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

const AUDIT_CHECKS = [
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' />
        <circle cx='12' cy='9' r='2.5' />
      </svg>
    ),
    name: "Google Business Profile",
    desc: "Claimed, complete, keyword-optimized, active with posts and photos.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
      </svg>
    ),
    name: "Reviews",
    desc: "Quantity, recency, average rating, and whether you're responding.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <circle cx='11' cy='11' r='8' />
        <path d='m21 21-4.35-4.35' />
      </svg>
    ),
    name: "On-Page SEO",
    desc: "Title tags, H1s, service pages, and keyword targeting for your trade and city.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
      </svg>
    ),
    name: "Technical SEO",
    desc: "Core Web Vitals, mobile-friendliness, HTTPS, sitemap, and schema markup.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
        <polyline points='14 2 14 8 20 8' />
        <line x1='16' y1='13' x2='8' y2='13' />
        <line x1='16' y1='17' x2='8' y2='17' />
        <polyline points='10 9 9 9 8 9' />
      </svg>
    ),
    name: "Citations",
    desc: "NAP consistency across Google, Yelp, BBB, Angi, and HomeAdvisor.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
        <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
      </svg>
    ),
    name: "Backlinks",
    desc: "Domain authority signals, local and industry links, anchor text quality.",
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <circle cx='12' cy='8' r='6' />
        <path d='M15.477 12.89 17 22l-5-3-5 3 1.523-9.11' />
      </svg>
    ),
    name: "Competitors",
    desc: "Top 3 Map Pack results for your trade and city — and how you compare.",
  },
];

const REASONS = [
  {
    title: "It uses real data, not templates",
    body: "The AI researches your actual GBP listing, website, and citations in real time using web search. Every finding is specific to your business — not a generic checklist.",
  },
  {
    title: "You get a score you can act on",
    body: "Every section is scored 1–10 with a traffic light. You'll know in 90 seconds whether you're in green, yellow, or red — and exactly what to fix first.",
  },
  {
    title: "It shows you what competitors are doing",
    body: "The audit finds the top 3 businesses ranking in your Map Pack and tells you how their GBP, reviews, and web presence compare to yours.",
  },
  {
    title: "The report is yours to keep",
    body: "Every audit gets a permanent shareable URL. Send it to a partner, a web developer, or your team. No login required to view it.",
  },
];

const GET_ITEMS = [
  "A score out of 10 for all 7 local SEO factors",
  "Plain-English findings — no jargon, just business impact",
  "A specific next step for every section",
  "Your top 3 highest-impact priorities",
  "A competitor comparison for your trade and city",
  "A branded PDF report delivered to your email",
  "A permanent shareable URL for your audit",
];

const FAQS = [
  {
    q: "Is this actually free?",
    a: "Yes. No credit card, no trial. You run the audit, get the report, and keep the shareable URL — no cost.",
  },
  {
    q: "How accurate is the audit?",
    a: "It uses live web search to research your actual Google Business Profile, website, and citation listings. It's as accurate as what's publicly visible about your business right now.",
  },
  {
    q: "What if I don't have a website yet?",
    a: "Check the \"No website yet\" box on the form. The audit will focus on your GBP, reviews, and citations — and it'll show you exactly what you're missing by not having a site.",
  },
  {
    q: "How long does it take?",
    a: "60–90 seconds for a full audit. The AI searches multiple sources in parallel, so you're not waiting long.",
  },
  {
    q: "Do I need to give you my email?",
    a: "The first 4 audit sections are visible immediately — no email needed. Your full action plan for all 7 sections requires an email, and we'll also send you a PDF copy.",
  },
  {
    q: "What trades does this work for?",
    a: "HVAC, plumbing, electrical, roofing, landscaping, remodeling, general contracting, and more. If you're a local contractor, the audit will work for your business.",
  },
  {
    q: "I already have good reviews. Why would I need this?",
    a: "Reviews are one of 7 factors. Contractors with great reviews still lose Map Pack spots because of weak citations, missing schema markup, or a GBP with outdated info. The audit shows you the full picture.",
  },
];
