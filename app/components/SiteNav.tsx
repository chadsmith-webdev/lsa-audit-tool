"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/SiteNav.module.css";

// Links point to main site (different domain)
const navLinks = [
  { label: "Services", href: "https://localsearchally.com/services" },
  { label: "Service Areas", href: "https://localsearchally.com/service-areas" },
  { label: "Portfolio", href: "https://localsearchally.com/portfolio" },
  { label: "Blog", href: "https://localsearchally.com/blog" },
  { label: "About", href: "https://localsearchally.com/about" },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <a href='https://localsearchally.com' className={styles.logo}>
          <svg
            className={styles.logoIcon}
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
          <span className={styles.logoText}>
            Local Search <span>Ally</span>
          </span>
        </a>

        {/* Desktop links */}
        <nav aria-label='Main navigation'>
          <ul className={styles.links}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop CTA */}
        <a
          href='https://localsearchally.com/contact'
          className={`${styles.cta} ${styles.desktopCta}`}
        >
          Let&apos;s Talk — It&apos;s Free
        </a>

        {/* Mobile menu button */}
        <button
          className={styles.menuBtn}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          ) : (
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <line x1='3' y1='7' x2='21' y2='7' />
              <line x1='3' y1='12' x2='21' y2='12' />
              <line x1='3' y1='17' x2='21' y2='17' />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}
        aria-hidden={!menuOpen}
      >
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <a
          href='https://localsearchally.com/contact'
          className={styles.mobileCta}
          onClick={() => setMenuOpen(false)}
        >
          Let&apos;s Talk — It&apos;s Free →
        </a>
      </div>
    </header>
  );
}
