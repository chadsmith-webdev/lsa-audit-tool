import styles from "@/styles/landing.module.css";

export default function FinalCtaSection() {
  return (
    <section className={styles.finalCta} aria-labelledby="final-cta-title">
      <p className={styles.finalCtaEyebrow}>Free · No email required · 90 seconds</p>
      <h2 id="final-cta-title" className={styles.finalCtaTitle}>
        Find out why Google isn&apos;t{" "}
        <em>showing you</em>
      </h2>
      <p className={styles.finalCtaSub}>
        Your competitors checked their rankings this week. Now it&apos;s your turn.
      </p>

      <a href="#top" className={styles.finalCtaBtn} id="final-cta-button">
        Run My Free Audit →
      </a>

      <div className={styles.finalCtaPills}>
        <span className={styles.heroPill}>Free</span>
        <span className={styles.heroPill}>Results in 90 Seconds</span>
        <span className={styles.heroPill}>No Email to Start</span>
        <span className={styles.heroPill}>Real Data — Not Estimates</span>
      </div>
    </section>
  );
}
