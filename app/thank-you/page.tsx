"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import styles from "@/styles/thankYou.module.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://audit.localsearchally.com";
const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ?? process.env.CALENDLY_URL ?? "";

function ThankYouContent() {
  const params = useSearchParams();
  const auditId = params.get("auditId");
  const auditUrl = auditId ? `${SITE_URL}/audit/${auditId}` : null;

  function handleCalendlyClick() {
    if (
      typeof window !== "undefined" &&
      typeof (window as { gtag?: (...args: unknown[]) => void }).gtag ===
        "function"
    ) {
      (window as { gtag: (...args: unknown[]) => void }).gtag(
        "event",
        "calendly_click",
        { event_category: "engagement" },
      );
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.checkmark} aria-hidden='true'>
        <svg
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <polyline points='20 6 9 17 4 12' />
        </svg>
      </div>

      <h1 className={styles.heading}>Your report is on its way</h1>

      <p className={styles.subheading}>
        Check your inbox — the full PDF audit plan is headed there now. In the
        meantime, if you want to talk through the findings, grab a free
        15-minute call below.
      </p>

      <div className={styles.steps}>
        <p className={styles.stepsTitle}>What happens next</p>
        <div className={styles.step}>
          <span className={styles.stepNum}>1</span>
          <span>
            <strong>PDF in your inbox</strong> — full section-by-section
            breakdown with ranked action items.
          </span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>2</span>
          <span>
            <strong>Day 2 follow-up</strong> — one quick fix focused on your
            lowest-scoring area.
          </span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>3</span>
          <span>
            <strong>Day 5 &amp; 10</strong> — what Map Pack leaders in your
            trade do that most contractors skip.
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.calendlySection}>
        <p className={styles.calendlyLabel}>Want faster results?</p>
        {CALENDLY_URL ? (
          <a
            href={CALENDLY_URL}
            target='_blank'
            rel='noopener noreferrer'
            className={styles.calendlyBtn}
            onClick={handleCalendlyClick}
          >
            Book a Free 15-Minute Strategy Call →
          </a>
        ) : (
          <a
            href='https://localsearchally.com/contact'
            target='_blank'
            rel='noopener noreferrer'
            className={styles.calendlyBtn}
            onClick={handleCalendlyClick}
          >
            Book a Free 15-Minute Strategy Call →
          </a>
        )}
      </div>

      {auditUrl && (
        <a href={auditUrl} className={styles.auditLink}>
          View your full audit report →
        </a>
      )}
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <div className={styles.page}>
      <SiteNavMinimal />
      <main className={styles.main}>
        <Suspense fallback={null}>
          <ThankYouContent />
        </Suspense>
      </main>
      <SiteFooterMinimal />
    </div>
  );
}
