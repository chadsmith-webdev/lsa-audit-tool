"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/landing.module.css";

export default function SiteNavMinimal() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <div className={styles.navInnerMinimal}>
        {/* Logo — links to main site, subtle */}
        <a href='https://localsearchally.com' className={styles.navLogo}>
          <svg
            className={styles.navLogoIcon}
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 100 100'
            aria-hidden='true'
          >
            <defs>
              <linearGradient
                id='needleGrad'
                x1='0'
                x2='1'
                gradientUnits='objectBoundingBox'
              >
                <stop offset='0' stopColor='white' stopOpacity='0.5' />
                <stop offset='0.45' stopColor='white' stopOpacity='1' />
                <stop offset='1' stopColor='white' stopOpacity='0.35' />
              </linearGradient>
              <clipPath id='ballClip'>
                <circle cx='50' cy='33' r='20' />
              </clipPath>
            </defs>
            <polygon points='48,52 52,52 50,93' fill='url(#needleGrad)' />
            <circle cx='50' cy='33' r='20' fill='#7bafd4' />
            <g clipPath='url(#ballClip)'>
              <circle cx='46' cy='28' r='10' fill='white' opacity='0.88' />
              <circle cx='49.5' cy='30.5' r='10.1' fill='#7bafd4' />
            </g>
          </svg>
          <span className={styles.navLogoText}>
            Local Search <span>Ally</span>
          </span>
        </a>

        <nav className={styles.navLinks} aria-label='Site'>
          <a
            href='https://localsearchally.com/about'
            className={styles.navLink}
          >
            About
          </a>
          <a
            href='https://localsearchally.com/contact'
            className={styles.navCta}
          >
            Book a call
          </a>
        </nav>
      </div>
    </header>
  );
}
