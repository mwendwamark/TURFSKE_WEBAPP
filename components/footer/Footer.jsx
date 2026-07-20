import Link from "next/link";
import styles from "./Footer.module.css";

const NAV_COLUMNS = [
  {
    heading: "EXPLORE",
    links: [
      { label: "Home",        href: "/" },
      { label: "Explore",     href: "/explore" },
      { label: "Book",        href: "/book" },
      { label: "Tournaments", href: "/tournaments" },
    ],
  },
  {
    heading: "ACCOUNT",
    links: [
      { label: "Sign Up",         href: "/auth/signup" },
      { label: "Log In",          href: "/auth/login" },
      { label: "Dashboard",       href: "/dashboard" },
      { label: "Forgot Password", href: "/auth/forgot-password" },
    ],
  },
  {
    heading: "COMPANY",
    links: [
      { label: "About",   href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Terms",   href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon fill="currentColor" stroke="none" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>

      {/* ── Top section ── */}
      <div className={`${styles.top} container`}>

        {/* Left — socials + contact */}
        <div className={styles.left}>
          <div className={styles.socials}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.social_btn}
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>

          <div className={styles.contact_info}>
            <p className={styles.contact_line}>Nairobi, Kenya</p>
            <a href="mailto:hello@turfske.com" className={styles.contact_link}>
              hello@turfske.com
            </a>
            <a href="tel:+254700000000" className={styles.contact_link}>
              (+254) 700 000 000
            </a>
          </div>
        </div>

        {/* Right — nav columns */}
        <nav className={styles.nav_columns} aria-label="Footer navigation">
          {NAV_COLUMNS.map((col) => (
            <div key={col.heading} className={styles.nav_col}>
              <p className={styles.col_heading}>{col.heading}</p>
              <ul className={styles.col_links}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.col_link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* ── Divider + CTA ── */}
      <div className={`${styles.divider_row} container`}>
        <hr className={styles.divider} />
        <Link href="/auth/signup" className={styles.cta_btn}>
          Get Started
        </Link>
      </div>

      {/* ── Bottom section ── */}
      <div className={`${styles.bottom} container`}>
        <p className={styles.tagline}>
          From grassroots football to competitive leagues — TurfsKE
          connects players and pitch managers across Kenya.
        </p>
        <div className={styles.legal}>
          <Link href="/terms" className={styles.legal_link}>
            TERMS &amp; CONDITIONS
          </Link>
          <Link href="/privacy" className={styles.legal_link}>
            PRIVACY POLICY
          </Link>
        </div>
      </div>

      {/* ── Giant brand name ── */}
      <div className={styles.wordmark_wrap} aria-hidden="true">
        <span className={styles.wordmark}>TURFSKE</span>
      </div>

    </footer>
  );
}