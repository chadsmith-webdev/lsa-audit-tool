import styles from "@/styles/SiteFooterMinimal.module.css";

export default function SiteFooterMinimal() {
  return (
    <footer className={styles.footer}>
      <p className={styles.copy}>
        &copy; {new Date().getFullYear()}{" "}Local Search Ally &middot; Siloam
        Springs, AR
      </p>
      <nav className={styles.siteLinks} aria-label="Site">
        <a href="https://localsearchally.com/about">About</a>
        <a href="https://localsearchally.com/services">Services</a>
        <a href="https://localsearchally.com/contact">Contact</a>
      </nav>
      <nav className={styles.legal} aria-label="Legal">
        <a href="https://localsearchally.com/privacy">Privacy Policy</a>
        <a href="https://localsearchally.com/terms">Terms of Service</a>
      </nav>
    </footer>
  );
}
