"use client";
import React from "react";
import styles from "./SmallHeader.module.css";
import { GiSoccerBall } from "react-icons/gi";

/**
 * SmallHeader — section label component — TurfsKE
 *
 * @param {string} text    - label text (auto-uppercased via CSS)
 * @param {string} variant - one of:
 *   "default"     — bare, just icon + text
 *   "pill"        — liquid glass light green tint
 *   "pill_black"  — white text on black background
 *   "pill_green"  — white text on primary green background
 *   "pill_lime"   — dark green text on lime background
 *   "white"       — white text and icon, no background
 *   "black"       — black text and icon, no background
 *   compound e.g. "white pill" still supported for legacy usage
 */
const SmallHeader = ({ text, variant = "default" }) => {
  const classes = variant
    .split(" ")
    .map((v) => styles[v] ?? "")
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${styles.container} ${classes}`}>
      <GiSoccerBall size={16} className={styles.ball} aria-hidden="true" />
      <span className={styles.text}>{text}</span>
    </div>
  );
};

export default SmallHeader;