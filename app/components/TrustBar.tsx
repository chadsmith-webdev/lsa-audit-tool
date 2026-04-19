import styles from "@/styles/landing.module.css";

const stats = [
  { num: "7", label: "Categories\nChecked" },
  { num: "90s", label: "Results in\n90 Seconds" },
  { num: "100%", label: "Real Data\nNot Estimates" },
  { num: "Free", label: "No Credit\nCard Ever" },
];

export default function TrustBar() {
  return (
    <div className={styles.trustBar}>
      <div className={styles.trustBarInner}>
        <div className={styles.statsRow} role="list" aria-label="Audit tool stats">
          {stats.map((s) => (
            <div key={s.label} className={styles.statChip} role="listitem">
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.featuredTestimonial}>
          <span className={styles.featuredStars} aria-label="5 stars">
            ★★★★★
          </span>
          <p className={styles.featuredQuote}>
            &ldquo;Showed me exactly why I wasn&rsquo;t showing up on Google.
            Fixed two things from the report and made it into the Map Pack
            within three weeks.&rdquo;
          </p>
          <span className={styles.featuredMeta}>
            Mike D. &middot; HVAC Contractor &middot; Rogers, AR
          </span>
        </div>
      </div>
    </div>
  );
}
