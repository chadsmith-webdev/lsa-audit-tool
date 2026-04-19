import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import HeroSection from "@/app/components/HeroSection";
import TrustBar from "@/app/components/TrustBar";
import HowItWorksSection from "@/app/components/HowItWorksSection";
import WhatWeCheckSection from "@/app/components/WhatWeCheckSection";
import TestimonialsSection from "@/app/components/TestimonialsSection";
import FaqSection from "@/app/components/FaqSection";
import FinalCtaSection from "@/app/components/FinalCtaSection";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import styles from "@/styles/landing.module.css";

export default function Home() {
  return (
    <>
      <SiteNavMinimal />
      <main className={styles.mainContent}>
        <HeroSection />
        <TrustBar />
        <HowItWorksSection />
        <WhatWeCheckSection />
        <TestimonialsSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <SiteFooterMinimal />
    </>
  );
}
