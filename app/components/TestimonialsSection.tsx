import styles from "@/styles/landing.module.css";

const testimonials = [
  {
    stars: "★★★★★",
    avatarPosition: "0% center",
    quote:
      "I had no idea my Google listing was missing half the info it needed. Fixed the categories and added 30 more photos — I went from zero Map Pack appearances to showing up for six different searches.",
    name: "Derek R. · Roofing · Bentonville, AR",
  },
  {
    stars: "★★★★★",
    avatarPosition: "50% center",
    quote:
      "The citations section was the wake-up call. I had three different phone numbers listed across the web. After cleaning those up, my call volume from Google went up noticeably within a month.",
    name: "Sarah M. · Plumbing · Fayetteville, AR",
  },
  {
    stars: "★★★★★",
    avatarPosition: "100% center",
    quote:
      "Turns out my competitor with half my experience and way fewer reviews was outranking me because of their GBP. The audit explained it clearly. Two months later I'm ahead of them.",
    name: "James T. · HVAC · Springdale, AR",
  },
];

export default function TestimonialsSection() {
  return (
    <section
      className={styles.section}
      aria-labelledby="testimonials-title"
    >
      <p className={styles.sectionLabel}>What contractors are saying</p>
      <h2 id="testimonials-title" className={styles.sectionTitle}>
        Real results from local contractors
      </h2>

      <div className={styles.testimonialsGrid}>
        {testimonials.map((t) => (
          <blockquote key={t.name} className={styles.testimonialCard}>
            {/* Avatar */}
            <div
              className={styles.testimonialAvatar}
              style={{ backgroundPosition: t.avatarPosition }}
              role="img"
              aria-label={t.name.split(" · ")[0]}
            />
            <span className={styles.testimonialStars} aria-label="5 stars">
              {t.stars}
            </span>
            <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
            <footer className={styles.testimonialName}>{t.name}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

