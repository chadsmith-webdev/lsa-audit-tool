import type { Metadata } from "next";
import Image from "next/image";
import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import HeroSection from "@/app/components/HeroSection";
import DiagnosticGrid from "@/app/components/DiagnosticGrid";
import TrustBar from "@/app/components/TrustBar";
import HowItWorksSection from "@/app/components/HowItWorksSection";
import ReportPreviewSection from "@/app/components/ReportPreviewSection";
import TestimonialsSection from "@/app/components/TestimonialsSection";
import FinalCtaSection from "@/app/components/FinalCtaSection";
import styles from "@/styles/landing.module.css";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Free Local SEO Audit for Contractors | Local Search Ally",
  description:
    "See how your contracting business ranks on Google. Free AI audit checks 7 factors — GBP, reviews, citations, and more. Results in 90 seconds.",
  alternates: {
    canonical: "https://audit.localsearchally.com/free-local-seo-audit",
  },
  openGraph: {
    title: "Find Out If Google Can Find You — Free Local SEO Audit",
    description:
      "Free AI-powered audit for NWA contractors. 7 factors, real data, plain-English findings. No signup. 90 seconds.",
    url: "https://audit.localsearchally.com/free-local-seo-audit",
    type: "website",
    images: [
      {
        url: "https://audit.localsearchally.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Local Search Ally — Free Local SEO Audit for Contractors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Out If Google Can Find You — Free Local SEO Audit",
    description:
      "Free AI audit for NWA contractors. Checks GBP, reviews, citations, and 4 more factors. Real data. 90 seconds.",
    images: ["https://audit.localsearchally.com/og-image.png"],
  },
};

// ─── Structured data ──────────────────────────────────────────────────────────

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Local SEO Audit Tool",
  description:
    "Free local SEO audit for contractors. Checks Google Business Profile, reviews, on-page SEO, technical SEO, citations, backlinks, and competitors in 90 seconds.",
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

      <SiteNavMinimal />

      <main className={styles.mainContent}>
        {/* Hero — form is the CTA */}
        <HeroSection />

        {/* Map Pack visual — makes the problem visceral before trust-building */}
        <div className={styles.mapPackVisual}>
          <Image
            src="/map-pack-visibility.png"
            alt="Google Map Pack showing two active contractor listings and one ghosted invisible listing"
            width={900}
            height={900}
            className={styles.mapPackImg}
            priority={false}
          />
        </div>

        {/* Trust bar — stats + featured testimonial immediately below the hero */}
        <TrustBar />

        {/* How it works — orient cold ad traffic before they hit the detail */}
        <HowItWorksSection />

        {/* Report preview — show the output before they commit */}
        <ReportPreviewSection />

        {/* What the audit checks */}
        <section className={styles.section} aria-labelledby='checks-heading'>
          <p className={styles.sectionLabel}>WHAT THE AUDIT CHECKS</p>
          <h2 className={styles.sectionTitle} id='checks-heading'>
            7 signals that determine
            <br />
            whether you&rsquo;re found or invisible
          </h2>
          <p className={styles.sectionBody}>
            97% of consumers use Google to evaluate local businesses before
            calling. The scan researches your actual GBP listing, website,
            reviews, and citations using live web data — and flags every
            technical gap keeping you off the Map Pack.
          </p>
          <DiagnosticGrid />
        </section>

        {/* Testimonials — social proof after content builds conviction */}
        <TestimonialsSection />

        {/* Why contractors use it */}
        <section className={styles.section} aria-labelledby='why-heading'>
          <p className={styles.sectionLabel}>WHY I BUILT THIS</p>
          <h2 className={styles.sectionTitleSpaced} id='why-heading'>
            The BEST contractors in town shouldn&rsquo;t be the hardest to find.
          </h2>

          <div className={styles.transformationVisual}>
            <Image
              src="/visibility-transformation.png"
              alt="Before vs After comparison showing a missing business listing becoming dominant at #1 on Google"
              width={800}
              height={400}
              className={styles.transformationImg}
              loading="eager"
            />
          </div>

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
          <h2 className={styles.sectionTitleSpaced} id='get-heading'>
            Everything in the report,
            <br />
            explained up front
          </h2>
          <ul className={styles.getList} role='list'>
            {GET_ITEMS.map((item, i) => (
              <li key={i} className={styles.getItem}>
                <span className={styles.getNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={styles.getBody}>
                  <span className={styles.getLabel}>{item.label}</span>
                  <span className={styles.getTitle}>{item.title}</span>
                  <span className={styles.getDesc}>{item.body}</span>
                </div>
                <span className={styles.getBadge}>Included</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ — handle final objections before the last CTA */}
        <section className={styles.sectionWide} aria-labelledby='faq-heading'>
          <p className={styles.sectionLabel}>FAQ · COMMON QUESTIONS</p>
          <h2 className={styles.sectionTitle} id='faq-heading'>
            Questions I hear before people run the audit
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

        {/* Final CTA — repeat the conversion action before footer */}
        <FinalCtaSection />
      </main>

      <SiteFooterMinimal />
    </>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

const REASONS = [
  {
    title: "I built it because good contractors deserve to be found",
    body: "Too many skilled NWA trade owners sit invisible online while a franchise with a bigger ad budget owns the Map Pack. This scan shows you exactly where the gap is — and what's causing it.",
  },
  {
    title: "78% of local mobile searches result in an offline purchase",
    body: "When someone searches for a plumber or HVAC tech nearby, they're ready to call — not browse. If your business isn't showing up, that call goes to whoever is. The scan tells you exactly what's keeping you out.",
  },
  {
    title: "It checks seven factors, not just reviews",
    body: "Citations, schema markup, GBP completeness, on-page content, backlinks, and how your presence compares to whoever is already ranking above you — the scan covers all seven.",
  },
  {
    title: "The report is yours to keep",
    body: "Every audit gets a permanent shareable URL. Send it to a developer, a partner, or your team — no login required.",
  },
];

const GET_ITEMS = [
  {
    label: "Scoring",
    title: "Scores for all 7 local SEO factors",
    body: "Every category is rated 1–10 with a traffic-light status so you know at a glance where you stand.",
  },
  {
    label: "Findings",
    title: "Plain-English findings",
    body: "No jargon — every finding describes the business impact in plain terms a contractor can act on.",
  },
  {
    label: "Actions",
    title: "A specific next step per section",
    body: "Each section ends with one high-leverage action you can take this week — not a vague recommendation.",
  },
  {
    label: "Priorities",
    title: "Your top 3 highest-impact priorities",
    body: "The audit ranks your biggest opportunities so you know exactly where to focus your time and budget.",
  },
  {
    label: "Competitors",
    title: "A competitor comparison",
    body: "See how the top 3 businesses ranking in your Map Pack compare to you on GBP, reviews, and web presence.",
  },
  {
    label: "PDF Report",
    title: "A branded PDF report by email",
    body: "Unlock the full report with your email and get a formatted PDF delivered instantly — yours to keep.",
  },
  {
    label: "Shareable URL",
    title: "A permanent shareable link",
    body: "Every audit gets its own URL. Send it to a developer, a partner, or your team — no login required to view.",
  },
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
    a: 'Check the "No website yet" box on the form. The audit will focus on your GBP, reviews, and citations — and it\'ll show you exactly what you\'re missing by not having a site.',
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
  {
    q: "Will you try to sell me something after?",
    a: "No pitch, no follow-up call unless you ask for one. You'll get your results, a shareable link, and a PDF if you enter your email. That's it. If you want to talk about fixing what the audit finds, there's a link to book a free call — but it's there if you want it, not pushed on you.",
  },
];
