"use client";
import React, { useState } from "react";
import styles from "./HomeRoles.module.css";
import SmallHeader from "@/components/ui/smallHeader/SmallHeader";
import { ArrowUpRight } from "lucide-react";
import { TbSoccerField, TbPlayFootball } from "react-icons/tb";
import Button from "@/components/ui/buttons/Button";

const CONTENT = {
  manager: {
    badge: "For Turf Managers",
    headline: "Fill every slot. Grow your revenue.",
    sub: "Stop relying on phone calls and word of mouth. List your turf once and let players come to you.",
    items: [
      {
        step: "01",
        title: "List your turf",
        desc: "Add your venue, upload photos, set your pricing and availability in under 10 minutes.",
      },
      {
        step: "02",
        title: "Receive reservation requests",
        desc: "Players browse and send interest directly through the app. You see every request in one place.",
      },
      {
        step: "03",
        title: "Confirm and manage",
        desc: "Approve requests, mark slots as taken, and contact players through their listed details.",
      },
      {
        step: "04",
        title: "Build your reputation",
        desc: "Verified listings and player reviews help your turf stand out and attract repeat bookings.",
      },
    ],
    cta: { primary: "List Your Turf", secondary: "See how it works" },
  },
  player: {
    badge: "For Players",
    headline: "Find and book a pitch near you.",
    sub: "No middlemen. No back-and-forth. Discover available turfs in your area and send a reservation in seconds.",
    items: [
      {
        step: "01",
        title: "Discover turfs near you",
        desc: "Browse active pitches by location, pitch format, surface type, and price across Kenya.",
      },
      {
        step: "02",
        title: "Check availability",
        desc: "See real-time slot availability. Booked times are clearly marked so you pick a slot that works.",
      },
      {
        step: "03",
        title: "Send a reservation",
        desc: "Select your date and time, submit your request in seconds. No account needed to browse.",
      },
      {
        step: "04",
        title: "The manager confirms",
        desc: "Once approved, the manager contacts you directly using the details you provided.",
      },
    ],
    cta: { primary: "Find a Turf", secondary: "Download the app" },
  },
};

export default function HomeRoles() {
  const [active, setActive] = useState("player");
  const content = CONTENT[active];

  return (
    <section className={`section ${styles.roles}`}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <div>
            <SmallHeader text="Who is TurfsKE for?" variant="pill_lime" />
          </div>
          <h2 className={`section_title ${styles.headline}`}>
            Turfs in Kenya — Designed for Every Player &amp; Manager
          </h2>
        </header>

        <div className={styles.layout}>
          {/* LEFT — role selector cards, 1/3 */}
          <div className={styles.left}>
            {[
              { key: "player", label: "Players", sub: "Find and book pitches" },
              {
                key: "manager",
                label: "Turf Owners",
                sub: "List and manage venues",
              },
            ].map(({ key, label, sub }) => (
              <button
                key={key}
                className={`${styles.roleCard} ${active === key ? styles.roleCardActive : ""}`}
                onClick={() => setActive(key)}
                aria-pressed={active === key}
              >
                <div className={styles.roleCardIcons}>
                  {key === "player" ? (
                    <TbPlayFootball className={styles.roleIcon} />
                  ) : (
                    <TbSoccerField className={styles.roleIcon} />
                  )}
                </div>

                <div className={styles.roleCardTitles}>
                  <div className={styles.roleCardTop}>
                    <span className={`sub_section_title ${styles.roleLabel}`}>
                      {label}
                    </span>
                    <span
                      className={`${styles.arrow} ${active === key ? styles.arrowActive : ""}`}
                    >
                      <ArrowUpRight />
                    </span>
                  </div>
                  <p className={styles.roleSub}>{sub}</p>
                </div>

                {active === key && (
                  <span className={styles.activePip} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          {/* RIGHT — content panel, 2/3 */}
          <div className={styles.right} key={active}>
            <p className={styles.badge}>{content.badge}</p>
            <h3 className={styles.contentHeadline}>{content.headline}</h3>
            <p className={styles.contentSub}>{content.sub}</p>

            <div className={styles.steps}>
              {content.items.map((item) => (
                <div key={item.step} className={styles.step}>
                  <span className={styles.stepNum}>{item.step}</span>
                  <div className={styles.stepText}>
                    <strong className={styles.stepTitle}>{item.title}</strong>
                    <p className={styles.stepDesc}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.ctas}>
              <Button size="lg" variant="black_outline" href="/explore">
                {content.cta.primary}
              </Button>
              {/* <Button size="lg" variant="secondary" href="/book">
                {content.cta.secondary}
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
