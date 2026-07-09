"use client";

import React, { useRef } from "react";
import SmallHeader from "@/components/ui/smallHeader/SmallHeader";
import styles from "./HomeTestimonial.module.css";
import Img1 from "../../../assets/home/user1.webp";
import Img2 from "../../../assets/home/user2.webp";
import Img3 from "../../../assets/home/user3.webp";
import Img4 from "../../../assets/home/user4.webp";

const TESTIMONIALS = [
  {
    id: "brian",
    name: "Brian Otieno",
    role: "Player · Nairobi CBD",
    quote:
      "I used to call three different numbers before finding an open pitch. With TurfsKE I found one near me, checked the slot, and we were playing by 5pm. That's it.",
    avatar: Img1,
  },
  {
    id: "mercy",
    name: "Mercy Wanjiku",
    role: "Turf Manager · Kasarani",
    quote:
      "Before TurfsKE I was getting double bookings every weekend. Now my schedule is clean, I can see every reservation in one place, and my regulars actually come back.",
    avatar: Img2,
  },
  {
    id: "kevin",
    name: "Kevin Mwangi",
    role: "Player · Westlands",
    quote:
      "The best part? No awkward calls with strangers. I just pick a turf, send a request, and get a confirmation. My whole team books this way now.",
    avatar: Img3,
  },
  {
    id: "james",
    name: "James Kariuki",
    role: "Turf Owner · Embakasi",
    quote:
      "Listing was done in under ten minutes. Within a week I had bookings from people I'd never met. TurfsKE brought customers I would never have reached otherwise.",
    avatar: Img4,
  },
];

export default function HomeTestimonials() {
  const trackRef = useRef(null);

  return (
    <section className={`section ${styles.testimonials}`}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <div>
            <SmallHeader text="Testimonials" variant="pill_lime" />
          </div>
          <h2
            className={`section_title max_width_50 ${styles.h_solutions_large_header}`}
          >
            Don&apos;t just take our word for it. <br />
            Here&apos;s what our users have to say
          </h2>
        </header>

        {/* ── Scrollable card track */}
        <div className={styles.trackWrapper}>
          <div className={styles.track} ref={trackRef}>
            {TESTIMONIALS.map((t) => (
              <article
                key={t.id}
                className={styles.card}
              >
                {/* ✅ Fix 1: t.avatar.src extracts the string URL from the Next.js image object */}
                <div
                  className={styles.avatarBg}
                  style={{ backgroundImage: `url(${t.avatar.src})` }}
                  aria-hidden="true"
                />

                {/* Default state content */}
                <div className={styles.cardDefault}>
                  {/* ✅ Fix 2: same here — use t.avatar.src for the img src attribute */}
                  <img
                    src={t.avatar.src}
                    alt={t.name}
                    className={styles.avatar}
                    draggable={false}
                  />
                  <blockquote className={styles.quote}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <footer className={styles.cardFooter}>
                    <span className={styles.name}>{t.name}</span>
                    <span className={styles.role}>{t.role}</span>
                  </footer>
                </div>

                {/* Hover state — only name + role over expanded bg */}
                <div className={styles.cardHover} aria-hidden="true">
                  <footer className={styles.hoverFooter}>
                    <span className={styles.hoverName}>{t.name}</span>
                    <span className={styles.hoverRole}>{t.role}</span>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}