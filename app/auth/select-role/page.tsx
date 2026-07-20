"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "../Auth.module.css";
import roleStyles from "./SelectRole.module.css";

export default function SelectRolePage() {
  const [role, setRole]              = useState<"player" | "manager" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);
  const router                       = useRouter();

  async function handleConfirm() {
    if (!role) {
      setError("Please select a role to continue.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.replace("/dashboard");
    });
  }

  return (
    <div className={styles.page}>

      {/* Left panel — same visual as login/signup */}
      <div className={styles.visual}>
        <div className={styles.visual_overlay} />
        <div className={styles.visual_brand}>
          <span className={styles.visual_logo_text}>TURFSKE</span>
        </div>
        <div className={styles.visual_content}>
          <h2 className={styles.visual_tagline}>
            One last step before you play
          </h2>
          <p className={styles.visual_sub}>
            Tell us how you plan to use TurfsKE so we can set up
            the right experience for you.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.form_panel}>
        <div className={styles.form_inner}>

          <div className={styles.form_header}>
            <h1 className={styles.form_title}>How will you use TurfsKE?</h1>
            <p className={styles.form_sub}>
              Pick your role — you can only choose one.
            </p>
          </div>

          <div className={roleStyles.role_cards}>

            <button
              type="button"
              className={`${roleStyles.role_card} ${role === "player" ? roleStyles.role_card_active : ""}`}
              onClick={() => { setRole("player"); setError(null); }}
            >
              <span className={roleStyles.role_icon}>🏃</span>
              <div className={roleStyles.role_text}>
                <strong>I am a Player</strong>
                <span>Find and book football pitches near me</span>
              </div>
              <span className={roleStyles.role_check}>
                {role === "player" ? "✓" : ""}
              </span>
            </button>

            <button
              type="button"
              className={`${roleStyles.role_card} ${role === "manager" ? roleStyles.role_card_active : ""}`}
              onClick={() => { setRole("manager"); setError(null); }}
            >
              <span className={roleStyles.role_icon}>🏟️</span>
              <div className={roleStyles.role_text}>
                <strong>I am a Turf Manager</strong>
                <span>List my venue and manage bookings</span>
              </div>
              <span className={roleStyles.role_check}>
                {role === "manager" ? "✓" : ""}
              </span>
            </button>

          </div>

          {error && (
            <div className={`${styles.message} ${styles.message_error}`}>
              <p>{error}</p>
            </div>
          )}

          <button
            className={styles.submit_btn}
            onClick={handleConfirm}
            disabled={isPending || !role}
          >
            {isPending ? "Setting up your account..." : "Continue"}
          </button>

        </div>
      </div>
    </div>
  );
}