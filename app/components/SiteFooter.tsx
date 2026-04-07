import styles from "@/styles/SiteFooter.module.css";

// ─── Link sets — all point to main site (different domain) ────────────────────

const serviceLinks = [
  {
    label: "Local SEO",
    href: "https://localsearchally.com/services#local-seo",
  },
  {
    label: "Web Design",
    href: "https://localsearchally.com/services#web-design",
  },
  {
    label: "GBP Optimization",
    href: "https://localsearchally.com/services#gbp",
  },
  {
    label: "Reputation",
    href: "https://localsearchally.com/services#reputation",
  },
  { label: "Free SEO Audit", href: "#top" },
];

const companyLinks = [
  { label: "About", href: "https://localsearchally.com/about" },
  { label: "Blog", href: "https://localsearchally.com/blog" },
  { label: "Portfolio", href: "https://localsearchally.com/portfolio" },
  { label: "Service Areas", href: "https://localsearchally.com/service-areas" },
  { label: "Contact", href: "https://localsearchally.com/contact" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <a href='https://localsearchally.com' className={styles.logo}>
              <svg
                className={styles.logoIcon}
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 100 100'
                aria-hidden='true'
              >
                <defs>
                  <linearGradient
                    id='footerNeedleGrad'
                    x1='0'
                    x2='1'
                    gradientUnits='objectBoundingBox'
                  >
                    <stop offset='0' stopColor='white' stopOpacity='0.5' />
                    <stop offset='0.45' stopColor='white' stopOpacity='1' />
                    <stop offset='1' stopColor='white' stopOpacity='0.35' />
                  </linearGradient>
                  <clipPath id='footerBallClip'>
                    <circle cx='50' cy='33' r='20' />
                  </clipPath>
                </defs>
                <polygon
                  points='48,52 52,52 50,93'
                  fill='url(#footerNeedleGrad)'
                />
                <circle cx='50' cy='33' r='20' fill='#7bafd4' />
                <g clipPath='url(#footerBallClip)'>
                  <circle cx='46' cy='28' r='10' fill='white' opacity='0.88' />
                  <circle cx='49.5' cy='30.5' r='10.1' fill='#7bafd4' />
                </g>
              </svg>
              <span className={styles.logoText}>
                Local Search <span>Ally</span>
              </span>
            </a>
            <p className={styles.tagline}>
              The best contractor in town shouldn&apos;t be the hardest to find.
            </p>
            <a href='tel:+14793808626' className={styles.phone}>
              (479) 380-8626
            </a>
          </div>

          {/* Services */}
          <div className={styles.col}>
            <h4>Services</h4>
            <ul>
              {serviceLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className={styles.col}>
            <h4>Company</h4>
            <ul>
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            &copy; {new Date().getFullYear()} Local Search Ally &middot; Siloam
            Springs, AR
          </p>
          <nav className={styles.legal} aria-label='Legal'>
            <a href='https://localsearchally.com/privacy'>Privacy Policy</a>
            <a href='https://localsearchally.com/terms'>Terms of Service</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
