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
    <header className={styles.heroRowCentered} id='top'>
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
          Not in the Map Pack? You&apos;re invisible to customers searching right now.
        </motion.p>

        <div className={styles.heroToolCentered}>
          <AuditTool />
        </div>

        <motion.div variants={fadeUp} className={styles.heroPillsCentered}>
          <span className={styles.heroPill}>Free</span>
          <span className={styles.heroPill}>Results in 90 Seconds</span>
          <span className={styles.heroPill}>No email to start</span>
        </motion.div>
      </motion.div>
    </header>
  );
}
