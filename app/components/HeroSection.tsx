"use client";

import { Suspense } from "react";
import { motion, type Variants } from "framer-motion";
import AuditTool from "@/app/components/AuditTool";
import styles from "@/styles/landing.module.css";

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HeroSection() {
  return (
    <section className={styles.hero} id='top'>
      <motion.div
        className={styles.heroInner}
        variants={container}
        initial='hidden'
        animate='visible'
      >
        <motion.h1 variants={fadeUp} className={styles.heroTitle}>
          Does your business show up <em>where it counts?</em>
        </motion.h1>

        <motion.p variants={fadeUp} className={styles.heroSub}>
          Free local SEO audit — Google Maps, reviews, and local search. 90
          seconds, no email.
        </motion.p>

        <motion.div variants={fadeUp} className={styles.heroForm}>
          <Suspense fallback={null}>
            <AuditTool />
          </Suspense>
        </motion.div>
      </motion.div>
    </section>
  );
}
