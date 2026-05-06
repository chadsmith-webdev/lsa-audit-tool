import SiteNavMinimal from "@/app/components/SiteNavMinimal";
import HeroSection from "@/app/components/HeroSection";
import SiteFooterMinimal from "@/app/components/SiteFooterMinimal";
import styles from "@/styles/landing.module.css";

export default function Home() {
  return (
    <>
      <SiteNavMinimal />
      <main className={styles.mainContent}>
        <HeroSection />
      </main>
      <SiteFooterMinimal />
    </>
  );
}
