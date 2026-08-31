"use client";

import React, { useRef } from "react";
import SmallHeader from "@/components/ui/smallHeader/SmallHeader";
import styles from "./HomeTestimonial.module.css";
import { TbPlayerPlayFilled, TbArrowLeft, TbArrowRight } from "react-icons/tb";
import Img1 from "../../../assets/home/user1.webp";
import Img2 from "../../../assets/home/user2.webp";
import Img3 from "../../../assets/home/user3.webp";
import Img4 from "../../../assets/home/user4.webp";

const TESTIMONIALS = [
  {
    id: "brian",
    name: "Brian Otieno",
    role: "Player · Nairobi CBD",
    headline: "Faster Bookings",
    quote:
      "I used to call three different numbers before finding an open pitch. With TurfsKE I found one near me, checked the slot, and we were playing by 5pm.",
    date: "Feb 3, 2026",
    avatar: Img1,
  },
  {
    id: "mercy",
    name: "Mercy Wanjiku",
    role: "Turf Manager · Kasarani",
    headline: "No More Double Bookings",
    quote:
      "Before TurfsKE I was getting double bookings every weekend. Now my schedule is clean, and my regulars actually come back.",
    date: "Jan 18, 2026",
    avatar: Img2,
  },
  {
    id: "kevin",
    name: "Kevin Mwangi",
    role: "Player · Westlands",
    headline: "Seamless Reservations",
    quote:
      "No awkward calls with strangers. I just pick a turf, send a request, and get a confirmation. My whole team books this way now.",
    date: "Aug 29, 2026",
    avatar: Img3,
  },
  {
    id: "james",
    name: "James Kariuki",
    role: "Turf Owner · Embakasi",
    headline: "New Customers, Fast",
    quote:
      "Listing was done in under ten minutes. Within a week I had bookings from people I'd never met before.",
    date: "Jul 10, 2026",
    avatar: Img4,
  },
];

export default function HomeTestimonials() {
  const trackRef = useRef(null);

  const scrollByAmount = (direction) => {
    const track = trackRef.current;
    if (!track) return;

    const pair = track.querySelector(`.${styles.pair}`);
    const amount = pair ? pair.getBoundingClientRect().width + 40 : 480;

    track.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className={`section ${styles.testimonials}`}>
      <div className={`container ${styles.inner}`}>
        <header className={`section_header two_column_header ${styles.header}`}>
          <div className={styles.headerText}>
            <div>
              <SmallHeader text="Testimonials" variant="pill_lime" />
            </div>
            <h2 className={`section_title ${styles.headline}`}>
              Don&apos;t just take our word for it. <br />
              Here&apos;s what our users have to say
            </h2>
          </div>

          <div className={styles.navButtons}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => scrollByAmount("prev")}
              aria-label="Previous testimonial"
            >
              <TbArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => scrollByAmount("next")}
              aria-label="Next testimonial"
            >
              <TbArrowRight aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* ── Scrollable card track: video thumbnail + quote card pairs */}
        <div className={styles.trackWrapper}>
          <div className={styles.track} ref={trackRef}>
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className={styles.pair}>
                {/* Video-style thumbnail */}
                <div
                  className={styles.videoCard}
                  style={{ backgroundImage: `url(${t.avatar.src})` }}
                >
                  {/* <span className={styles.playBtn} aria-hidden="true">
                    <TbPlayerPlayFilled />
                  </span> */}
                  <div className={styles.videoFooter}>
                    <span className={styles.videoName}>{t.name}</span>
                    <span className={styles.videoLabel}>Video Testimonial</span>
                  </div>
                </div>

                {/* Written quote card */}
                <article className={styles.quoteCard}>
                  <span className={styles.quoteMark} aria-hidden="true">
                    &rdquo;
                  </span>
                  <div className={styles.quoteHead}>
                    <span className={styles.name}>{t.name}</span>
                    <span className={styles.role}>{t.role}</span>
                  </div>
                  <h3 className={styles.cardHeadline}>{t.headline}</h3>
                  <blockquote className={styles.quote}>
                    &ldquo; {t.quote} &rdquo;
                  </blockquote>
                  <span className={styles.date}>{t.date}</span>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
