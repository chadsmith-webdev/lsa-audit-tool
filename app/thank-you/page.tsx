"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Script from "next/script";
import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import styles from "@/styles/thankYou.module.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://audit.localsearchally.com";

const CALENDLY_URL = "https://calendly.com/smithchadlamont";

function ThankYouContent() {
  const params = useSearchParams();
  const auditId = params.get("auditId");
  const auditUrl = auditId ? `${SITE_URL}/audit/${auditId}` : null;

  // Fire calendly_click GA4 event when the user schedules via the widget
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (
        e.origin === "https://calendly.com" &&
        e.data?.event === "calendly.event_scheduled"
      ) {
        if (
          typeof (window as unknown as { gtag?: unknown }).gtag === "function"
        ) {
          (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
            "event",
            "calendly_click",
            { event_category: "engagement" },
          );
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

      <h1 className={styles.heading}>Your PDF copy is on its way</h1>

      <p className={styles.subheading}>
        Check your inbox — a PDF version of the report is headed there now. You
        can also view the live report anytime at the link below. If you want to
        talk through the findings, grab a free 15-minute slot.
      </p>

      <div className={styles.steps}>
        <p className={styles.stepsTitle}>Where to start</p>
        <div className={styles.step}>
          <span className={styles.stepNum}>1</span>
          <span>
            <strong>Find your lowest-scoring section</strong> — that&rsquo;s
            your highest-leverage fix. Start there, not at the top.
          </span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>2</span>
          <span>
            <strong>Pick one priority action and do it this week</strong> — each
            section lists the single most impactful change. Block an hour and
            ship it.
          </span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>3</span>
          <span>
            <strong>Book a free 15-minute call</strong> — if you want someone to
            walk through the findings with you, or you&rsquo;re not sure where
            to start, grab a slot below.
          </span>
        </div>
      </div>

      {auditUrl && (
        <a href={auditUrl} className={styles.auditLink}>
          View your live audit report →
        </a>
      )}

      <div className={styles.divider} />

      <div className={styles.calendlySection}>
        <p className={styles.calendlyLabel}>
          Book a free 15-minute strategy call
        </p>
        <div
          className={`calendly-inline-widget ${styles.calendlyWidget}`}
          data-url={CALENDLY_URL}
          style={{ minWidth: "320px", height: "700px" }}
        />
      </div>
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
      <Script
        src='https://assets.calendly.com/assets/external/widget.js'
        strategy='lazyOnload'
      />
    </div>
  );
}
