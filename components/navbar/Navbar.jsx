"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import styles from "./Navbar.module.css";
import Button from "../ui/buttons/Button";

const nav_links = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Book", href: "/book" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "About", href: "/about" },
];

export function Navbar({ variant = "primary" }) {
  const [is_drawer_open, set_is_drawer_open] = useState(false);
  const [is_scrolled, set_is_scrolled] = useState(false);
  const [is_hidden, set_is_hidden] = useState(false);
  const last_scroll_y = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const handle_scroll = () => {
      const current_y = window.scrollY;

      if (current_y > 80) {
        set_is_scrolled(true);
        set_is_hidden(current_y > last_scroll_y.current);
      } else {
        set_is_scrolled(false);
        set_is_hidden(false);
      }

      last_scroll_y.current = current_y;
    };

    window.addEventListener("scroll", handle_scroll, { passive: true });
    return () => window.removeEventListener("scroll", handle_scroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = is_drawer_open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [is_drawer_open]);

  const close_drawer = () => set_is_drawer_open(false);

  const get_navbar_classes = () => {
    const classes = [styles.navbar];
    if (is_scrolled) classes.push(styles.scrolled);
    if (is_hidden && is_scrolled) classes.push(styles.hidden);
    return classes.join(" ");
  };

  const get_link_classes = (href) => {
    const classes = [styles.nav_link];
    if (pathname === href) classes.push(styles.active);
    return classes.join(" ");
  };

  const get_icon_color = () => {
    if (is_scrolled) return "#1e1e1e";
    return variant === "primary" ? "#ffffff" : "#1e1e1e";
  };

  return (
    <>
      <nav className={get_navbar_classes()}>
        <div className={`${styles.nav_container} container`}>
          {/* Logo */}
          <div className={styles.logo}>
            <Link href="/" className={styles.logo_link}>
              <span
                className={`${styles.logo_text} ${is_scrolled ? styles.logo_text_dark : ""}`}
              >
                TURFSKE
              </span>
            </Link>
          </div>

          {/* Pill nav links */}
          <div className={styles.pill}>
            <ul className={styles.nav_links}>
              {nav_links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={get_link_classes(link.href)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className={styles.cta}>
            {/* <Link
              href="/book"
              className={`${styles.cta_btn} ${is_scrolled ? styles.cta_btn_dark : styles.cta_btn_green}`}
            >
              Book Now
            </Link> */}
            <Button
            variant="glass"
              className={` ${is_scrolled ? styles.cta_btn_dark : styles.cta_btn_green}`}
            >
              Book Now
            </Button>
          </div>

          {/* Hamburger */}
          <button
            className={styles.menu_button}
            onClick={() => set_is_drawer_open(true)}
            aria-label="Open menu"
          >
            <Menu size={24} color={get_icon_color()} />
          </button>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`${styles.drawer_overlay} ${is_drawer_open ? styles.open : ""}`}
        onClick={close_drawer}
      />

      {/* Drawer */}
      <div
        className={`${styles.drawer} ${is_drawer_open ? styles.drawer_open : ""}`}
      >
        <button
          className={styles.close_button}
          onClick={close_drawer}
          aria-label="Close menu"
        >
          <X size={24} color="#ffffff" />
        </button>

        <span className={styles.drawer_logo}>TURFSKE</span>

        <ul className={styles.drawer_links}>
          {nav_links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${styles.drawer_link} ${
                  pathname === link.href ? styles.drawer_link_active : ""
                }`}
                onClick={close_drawer}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.drawer_cta}>
          <Link
            href="/book"
            className={styles.drawer_btn}
            onClick={close_drawer}
          >
            Book Now
          </Link>
        </div>
      </div>
    </>
  );
}

export default Navbar;
