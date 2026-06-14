"use client";

import Image from "next/image";
import styles from "./HomeHero.module.css";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import heroImg from "../../../assets/home/turf3.webp";
import Button from "@/components/ui/buttons/Button";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: <FaFacebook size={18} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: <FaInstagram size={18} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "X (Twitter)",
    href: "https://x.com",
    icon: <FaTwitter size={18} strokeWidth={2} aria-hidden="true" />,
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: <FaYoutube size={18} strokeWidth={2} aria-hidden="true" />,
  },
];

export function HomeHero() {
  return (
    <section className={styles.hero}>
      {/* Background image */}
      <div className={styles.hero_bg}>
        <Image
          src={heroImg}
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.hero_image}
        />
      </div>
      <div className={styles.hero_overlay} />

      {/* Three-column layout: brand col | spacer | content col */}
      <div className={`${styles.hero_inner} container`}>
        {/* LEFT — vertical brand text running bottom-to-top */}
        <div className={styles.hero_brand_col} aria-label="TURFSKE">
          <div className={styles.hero_brand}>
            <span className={styles.brand_solid}>TURFS</span>
            <span className={styles.brand_outline}>KE</span>
          </div>
        </div>

        {/* MIDDLE — empty, lets the background image show */}
        <div className={styles.hero_spacer} />

        {/* RIGHT — description, buttons, socials */}
        <div className={styles.hero_content}>
          <div className={styles.hero_socials}>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className={styles.social_icon}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.icon}
              </a>
            ))}
          </div>
          <div className={styles.hero_description}>
            <span className={styles.description_line} />
            <p className={styles.description_text}>
              List your turf or find one near you — TurfsKE connects managers
              with players across Kenya, making it easy to discover, compare,
              and book quality pitches in seconds.
            </p>
          </div>

          <div className={styles.hero_actions}>
            <Button size="lg" variant="primary" href="/explore">
              Explore Turfs
            </Button>
            <Button size="lg" variant="secondary" href="/book">
              List Your Turf
            </Button>
          </div>
          {/*  */}
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
