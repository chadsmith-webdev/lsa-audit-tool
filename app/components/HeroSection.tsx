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
    <header className={styles.heroRow} id='top'>
      <motion.div
        className={styles.heroCopy}
        variants={container}
        initial='hidden'
        animate='visible'
      >
        <motion.span variants={fadeUp} className={styles.eyebrow}>
          VISIBILITY SCAN · LOCAL SEARCH ALLY
        </motion.span>

        <motion.h1 variants={fadeUp} className={styles.heroTitle}>
          Reveal Your
          <br />
          <span className={styles.heroAccent}>Invisibility Score</span>
        </motion.h1>

        <motion.p variants={fadeUp} className={styles.heroSub}>
          If you&rsquo;re not in the Google Map Pack, you&rsquo;re invisible to
          customers searching right now. See exactly where you stand — free, in
          90 seconds.
        </motion.p>

        <motion.div variants={fadeUp} className={styles.heroPills}>
          <span className={styles.heroPill}>Free · No Email Required</span>
          <span className={styles.heroPill}>Results in 90 Seconds</span>
          <span className={styles.heroPill}>AI-Powered Recon</span>
        </motion.div>
      </motion.div>

      <div className={styles.heroTool}>
        <AuditTool />
      </div>
    </header>
  );
}
