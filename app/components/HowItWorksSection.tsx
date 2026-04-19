import styles from "@/styles/landing.module.css";

const steps = [
  {
    num: "01",
    title: "Enter your business info",
    body: "Tell us your trade, service city, business name, and website. Takes about 30 seconds.",
    time: "~30 seconds",
  },
  {
    num: "02",
    title: "We scan 7 ranking factors",
    body: "Google Business Profile, reviews, on-page SEO, technical health, citations, backlinks, and who's outranking you right now.",
    time: "~60–90 seconds",
  },
  {
    num: "03",
    title: "Get your full diagnostic",
    body: "See a ranked breakdown of exactly what's hurting your visibility — and the highest-impact fix to make first.",
    time: "Instant results",
  },
];

export default function HowItWorksSection() {
  return (
    <section className={styles.section} aria-labelledby="how-it-works-title">
      <p className={styles.sectionLabel}>How it works</p>
      <h2 id="how-it-works-title" className={styles.sectionTitle}>
        From form to full report in under two minutes
      </h2>

      <div className={styles.stepsRow}>
        {steps.map((step) => (
          <div key={step.num} className={styles.stepCard}>
            <div className={styles.stepNum} aria-hidden="true">
              {step.num}
            </div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepBody}>{step.body}</p>
            <span className={styles.stepTime}>{step.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
