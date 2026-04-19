"use client";

import { motion, type Variants } from "framer-motion";
import AuditTool from "@/app/components/AuditTool";
import styles from "@/styles/landing.module.css";

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function HeroSection() {
  return (
    <section className={styles.heroRowCentered} id='top'>
      <motion.div
        className={styles.heroCopyCentered}
        variants={container}
        initial='hidden'
        animate='visible'
      >
        <motion.span variants={fadeUp} className={styles.eyebrowCentered}>
          VISIBILITY SCAN · LOCAL SEARCH ALLY
        </motion.span>

        <motion.h1 variants={fadeUp} className={styles.heroTitleCentered}>
          Free Local SEO Audit —{" "}
          <em>See Why Google Isn&apos;t Showing You</em>
        </motion.h1>

        <motion.p variants={fadeUp} className={styles.heroSubCentered}>
          You&apos;re invisible to customers searching right now — this free
          audit reveals exactly why, in 90 seconds flat.
        </motion.p>

        <div className={styles.heroToolCentered}>
          <AuditTool />
        </div>

        <motion.div variants={fadeUp} className={styles.heroPillsCentered}>
          <span className={styles.heroPill}>Free</span>
          <span className={styles.heroPill}>Results in 90 Seconds</span>
          <span className={styles.heroPill}>No Email to Start</span>
          <span className={styles.heroPill}>Real Data — Not Estimates</span>
        </motion.div>

        <motion.p variants={fadeUp} className={styles.urgencyLine}>
          Your competitors checked their rankings this week.
        </motion.p>
      </motion.div>
    </section>
  );
}
