"use client";

import React, { useEffect, useRef } from "react";
import styles from "./HomeSolutions.module.css";
import SmallHeader from "@/components/ui/smallHeader/SmallHeader";
import { annotate } from "rough-notation";
import { TbCalendarOff, TbBolt, TbPhoneOff, TbMapPins } from "react-icons/tb";

const PROBLEMS = [
  {
    id: "double-booking",
    label: "Problem solved",
    headline: "No more double bookings",
    body: "Every slot is locked the moment it's taken. You see exactly what's available, in real time.",
    Icon: TbCalendarOff,
  },
  {
    id: "instant-booking",
    label: "Problem solved",
    headline: "Book in under a minute",
    body: "Pick a pitch, choose your slot, send a request. No calls, no waiting, no back-and-forth.",
    Icon: TbBolt,
  },
  {
    id: "no-walking",
    label: "Problem solved",
    headline: "Stop walking blind",
    body: "No more showing up to a full pitch. No more hunting for a manager's number. It's all here.",
    Icon: TbPhoneOff,
  },
  {
    id: "central-hub",
    label: "Problem solved",
    headline: "Every turf in one place",
    body: "Turfs across Kenya, listed, verified, and searchable by location, size, and price.",
    Icon: TbMapPins,
  },
];

export default function HomeSolutions() {
  const turfSkeRef = useRef(null);
  const annotationRef = useRef(null);
  const cardsRef = useRef([]);

  /* ── Rough-notation circle on "TurfsKe" */
  useEffect(() => {
    if (turfSkeRef.current) {
      annotationRef.current = annotate(turfSkeRef.current, {
        type: "circle",
        color: "#c7e976",
        padding: 8,
        strokeWidth: 2.5,
        iterations: 2,
        animationDuration: 800,
      });
      annotationRef.current.show();
    }
    return () => {
      if (annotationRef.current) annotationRef.current.remove();
    };
  }, []);

  /* ── Stagger cards in on scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.cardVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className={`section ${styles.h_solutions}`}>
      <div className={`${styles.h_solutions_container} container`}>

        {/* ── Header — untouched from original */}
        <header
          className={`section_header two_column_header ${styles.h_solutions_header}`}
        >
          <div className={styles.h_solutions_header_left}>
            <div>
              <SmallHeader text="Features" variant="pill_white" />
            </div>

            <h2
              className={`section_title white max_width_80 ${styles.h_solutions_large_header}`}
            >
              Why choose{" "}
              <span ref={turfSkeRef} style={{ display: "inline-block" }}>
                TurfsKe
              </span>
              ?
            </h2>
          </div>

          <div className="section_header_right">
            <p className={`white ${styles.h_solutions_sub}`}>
              TurfsKe has solved the challenge of finding a turf around you, no
              need for you to hustle with the turf owners anymore. TurfsKe is a
              one stop shop for all your turf needs.
            </p>
          </div>
        </header>

        {/* ── Problem cards */}
        <div className={styles.grid}>
          {PROBLEMS.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => (cardsRef.current[i] = el)}
              className={styles.card}
              style={{ "--delay": `${i * 90}ms` }}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardLabel}>{item.label}</span>
                <item.Icon className={styles.cardIcon} aria-hidden="true" />
              </div>
              <div className={styles.cardBottom}>
                <h3 className={styles.cardHeadline}>{item.headline}</h3>
                <p className={styles.cardBody}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}