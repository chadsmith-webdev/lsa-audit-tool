import Image from "next/image";
import styles from "@/styles/landing.module.css";

export default function ReportPreviewSection() {
  return (
    <section
      className={styles.reportPreviewSection}
      aria-labelledby="report-preview-title"
    >
      <p className={styles.sectionLabel}>WHAT YOU&apos;LL GET</p>
      <h2 id="report-preview-title" className={styles.sectionTitle}>
        Your full diagnostic, ready in 90 seconds
      </h2>
      <p className={styles.sectionBody}>
        Every audit produces a ranked breakdown — which factors are hurting you
        most, how you compare to whoever is already ranking above you, and the
        single highest-impact fix to make first.
      </p>

      <div className={styles.reportPreviewWrap}>
        <Image
          src="/audit-report-preview.png"
          alt="Sample audit report dashboard showing a 62/100 visibility score, 7-factor breakdown with pass/warning/fail statuses, and a competitor comparison row"
          width={680}
          height={680}
          className={styles.reportPreviewImg}
          priority={false}
        />
        <p className={styles.reportPreviewCaption}>
          Sample report — your results will reflect your actual business data
        </p>
      </div>
    </section>
  );
}
