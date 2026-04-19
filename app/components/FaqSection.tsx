import styles from "@/styles/landing.module.css";

const faqs = [
  {
    q: "Is this actually free?",
    a: "Yes — completely free, no credit card, no hidden fees. You get the full 7-category diagnostic report. If you want help acting on the results, that's where we can talk. But the audit itself is yours.",
  },
  {
    q: "Do I need to enter my email to get results?",
    a: "No email required to run the audit. You'll see your full score and the first four diagnostic sections immediately. To unlock the remaining categories, you can optionally provide your email — but it's your choice.",
  },
  {
    q: "How is this different from other free audits?",
    a: "Most \"free audits\" are just lead forms that spit out a generic PDF. This tool checks your actual Google Business Profile, pulls your live review data, and identifies the competitors outranking you right now — not estimates.",
  },
  {
    q: "I don't have a Google Business Profile yet — can I still use this?",
    a: "Yes. The audit will flag that as your highest-priority fix and show you exactly what you're losing by not having one. It's one of the most important things you can do for local visibility.",
  },
  {
    q: "What if I don't have a website?",
    a: "Check the \"No website yet\" box on the form. The audit will still run across the other six factors and show you what a website would add to your rankings — so you can see the exact cost of not having one.",
  },
  {
    q: "What do I do after I get my results?",
    a: "Each section comes with a specific priority action. Start with the highest-impact red items. If you want hands-on help, you can reach out to Local Search Ally — but there's no obligation. Many contractors fix the top issues themselves.",
  },
];

export default function FaqSection() {
  return (
    <section className={styles.section} aria-labelledby="faq-title">
      <p className={styles.sectionLabel}>Questions</p>
      <h2 id="faq-title" className={styles.sectionTitle}>
        Common questions
      </h2>

      <div className={styles.faqList}>
        {faqs.map((faq) => (
          <details key={faq.q} className={styles.faqItem}>
            <summary className={styles.faqQ}>{faq.q}</summary>
            <p className={styles.faqA}>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
