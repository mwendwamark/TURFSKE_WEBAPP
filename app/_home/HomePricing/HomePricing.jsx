"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./HomePricing.module.css";
import SmallHeader from "@/components/ui/smallHeader/SmallHeader";
import Button from "@/components/ui/buttons/Button";
import { TbCheck, TbUsers, TbUser, TbBuildingSkyscraper } from "react-icons/tb";

const PLANS = [
  {
    id: "explorer",
    name: "Explorer",
    audience: "For casual players",
    Icon: TbUser,
    monthly: 0,
    yearly: 0,
    features: [
      "Browse turfs across Kenya",
      "Real-time slot availability",
      "Send reservation requests",
      "Connect with managers on WhatsApp",
      "Search by location, size & format",
    ],
    cta: { label: "Start Browsing", variant: "outline", href: "/explore" },
  },
  {
    id: "pro",
    name: "Pro Manager",
    audience: "For single-venue turf managers",
    Icon: TbUsers,
    monthly: 1499,
    yearly: 1199,
    popular: true,
    features: [
      "Everything in Explorer",
      "List one venue with unlimited photos",
      "Manage bookings & slots in one dashboard",
      "Instant booking request notifications",
      "Set your own pricing & availability",
      "Customer reviews & reputation",
      "Priority support",
    ],
    cta: { label: "Upgrade to Pro", variant: "glass", href: "/pricing" },
  },
  {
    id: "fleet",
    name: "Fleet",
    audience: "For multi-venue operators & chains",
    Icon: TbBuildingSkyscraper,
    monthly: 4999,
    yearly: 3999,
    features: [
      "Everything in Pro Manager",
      "Unlimited venues under one account",
      "Advanced analytics & revenue reports",
      "Custom branding for your venues",
      "Team member access & roles",
      "Dedicated account manager",
    ],
    cta: { label: "Talk to Sales", variant: "black_outline", href: "/contact" },
  },
];

// Cascading comparison rows for the "Key Features" table.
// minTier: 0 = included from Explorer up, 1 = Pro Manager up, 2 = Fleet only
const FEATURES = [
  { label: "Browse turfs across Kenya", minTier: 0 },
  { label: "Real-time slot availability", minTier: 0 },
  { label: "Send reservation requests", minTier: 0 },
  { label: "Connect with managers on WhatsApp", minTier: 0 },
  { label: "Search by location, size & format", minTier: 0 },
  { label: "List venues with unlimited photos", minTier: 1 },
  { label: "Manage bookings & slots in one dashboard", minTier: 1 },
  { label: "Instant booking request notifications", minTier: 1 },
  { label: "Set your own pricing & availability", minTier: 1 },
  { label: "Customer reviews & reputation", minTier: 1 },
  { label: "Priority support", minTier: 1 },
  { label: "Unlimited venues under one account", minTier: 2 },
  { label: "Advanced analytics & revenue reports", minTier: 2 },
  { label: "Custom branding for your venues", minTier: 2 },
  { label: "Team member access & roles", minTier: 2 },
  { label: "Dedicated account manager", minTier: 2 },
];

export default function HomePricing() {
  const [billing, setBilling] = useState("yearly");
  const pricingRef = useRef(null);
  const annotationRef = useRef(null);

  /* ── Rough-annotation circle on "pricing" — lazy-loaded on viewport entry */
  useEffect(() => {
    if (!pricingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            import("rough-notation").then(({ annotate }) => {
              annotationRef.current = annotate(pricingRef.current, {
                type: "circle",
                color: "#c7e976",
                padding: 8,
                strokeWidth: 2.5,
                iterations: 2,
                animationDuration: 800,
              });
              annotationRef.current.show();
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(pricingRef.current);
    return () => {
      observer.disconnect();
      if (annotationRef.current) annotationRef.current.remove();
    };
  }, []);

  return (
    <section className={`section ${styles.pricing}`}>
      <div className={`container ${styles.inner}`}>
        {/* Hero heading row */}
        <div className={styles.heroRow}>
          <div>
            <SmallHeader text="Pricing" variant="pill_lime" />
          </div>

          <h2 className={`section_title ${styles.headline}`}>
            Simple &amp; Transparent{" "}
            <span
              ref={pricingRef}
              className={styles.heroTitleAccent}
              style={{ display: "inline-block" }}
            >
              pricing
            </span>
          </h2>
        </div>

        {/* Intro copy + billing toggle (left) / plan cards (right) */}
        <div className={styles.topRow}>
          <div className={styles.intro}>
            <h2 className={`sub_section_title`}>Your Turf Booking Toolkit</h2>
            <p className={styles.sub}>
              Start free as a player, or grow your turf revenue with plans built
              for managers. No hidden fees — cancel anytime.
            </p>

            <div
              className={styles.billing}
              role="group"
              aria-label="Billing period"
            >
              <button
                type="button"
                className={`${styles.toggleBtn} ${billing === "monthly" ? styles.toggleBtnActive : ""}`}
                onClick={() => setBilling("monthly")}
                aria-pressed={billing === "monthly"}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${billing === "yearly" ? styles.toggleBtnActive : ""}`}
                onClick={() => setBilling("yearly")}
                aria-pressed={billing === "yearly"}
              >
                Yearly
                <span className={styles.saveTag}>Save 20%</span>
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {PLANS.map((plan) => {
              const price = billing === "yearly" ? plan.yearly : plan.monthly;
              return (
                <article
                  key={plan.id}
                  className={`${styles.card} ${plan.popular ? styles.cardPopular : ""}`}
                >
                  {plan.popular && (
                    <span className={styles.badge}>Most Popular</span>
                  )}

                  <div className={styles.cardHeader}>
                    <span className={styles.iconWrap}>
                      <plan.Icon className={styles.icon} aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className={styles.planName}>{plan.name}</h4>
                      <p className={styles.planAudience}>{plan.audience}</p>
                    </div>
                  </div>

                  <div className={styles.priceRow}>
                    <span className={styles.currency}>KSh</span>
                    <span className={styles.price}>
                      {price.toLocaleString()}
                    </span>
                    <span className={styles.period}>
                      /{billing === "yearly" ? "month, billed yearly" : "month"}
                    </span>
                  </div>

                  <ul className={styles.features}>
                    {plan.features.map((feature, i) => (
                      <li key={i} className={styles.feature}>
                        <span className={styles.check}>
                          <TbCheck aria-hidden="true" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className={styles.cta}>
                    <Button
                      href={plan.cta.href}
                      variant={plan.cta.variant}
                      className={styles.ctaBtn}
                    >
                      {plan.cta.label}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Key features comparison table */}
        {/* <div className={styles.featuresSection}>
          <h3 className={styles.featuresTitle}>Key Features</h3>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.rowLabelHead} scope="col">
                    <span className={styles.srOnly}>Feature</span>
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className={`${styles.colHead} ${plan.popular ? styles.colHeadPopular : ""}`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, idx) => (
                  <tr key={idx}>
                    <th scope="row" className={styles.rowLabel}>
                      {f.label}
                    </th>
                    {PLANS.map((plan, planIdx) => {
                      const included = planIdx >= f.minTier;
                      return (
                        <td key={plan.id} className={styles.cell}>
                          {included ? (
                            <span
                              className={`${styles.checkDot} ${plan.popular ? styles.checkDotPopular : ""}`}
                            >
                              <TbCheck aria-hidden="true" />
                              <span className={styles.srOnly}>Included</span>
                            </span>
                          ) : (
                            <span className={styles.dash} aria-hidden="true">
                              –
                              <span className={styles.srOnly}>
                                Not included
                              </span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> */}

        <p className={styles.footnote}>
          Prices are in Kenyan Shillings and inclusive of VAT. Teams &amp;
          schools get special rates —{" "}
          <a className={styles.footnoteLink} href="/contact">
            contact us
          </a>
          .
        </p>
      </div>
    </section>
  );
}
