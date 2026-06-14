import React from "react";
import styles from "./SmallHeader.module.css";
import { GiSoccerBall } from "react-icons/gi";

/**
 * SmallHeader — section label component — TurfsKE
 *
 * @param {string} text    - label text (auto-uppercased via CSS)
 * @param {string} variant - "default" | "pill"
 */
const SmallHeader = ({ text, variant = "default" }) => {
  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      <GiSoccerBall size={16} className={styles.ball} aria-hidden="true" />
      <span className={styles.text}>{text}</span>
    </div>
  );
};

export default SmallHeader;