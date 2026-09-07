"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { forgotPassword } from "../actions";
import Button from "@/components/ui/buttons/Button";
import styles from "../Auth.module.css";
import turfImage from "@/assets/home/turf3.webp";
import { HiMiniArrowLongLeft } from "react-icons/hi2";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await forgotPassword(formData);
      if (result?.error)   setMessage({ type: "error",   text: result.error });
      if (result?.success) setMessage({ type: "success", text: result.success });
    });
  }

  return (
    <div className={styles.page}>
      {/* ── Left — visual panel ── */}
      <div className={styles.visual}>
        <Image
          src={turfImage}
          alt="A football turf in Kenya"
          className={styles.visual_image}
          priority
          fill
          sizes="50vw"
        />
        <div className={styles.visual_overlay} />

        <div className={styles.visual_brand}>
          <Link href="/" className={styles.visual_logo_text}>
            TURFSKE
          </Link>
        </div>

        <div className={styles.visual_content}>
          <h2 className={styles.visual_tagline}>Forgot your password?</h2>
          <p className={styles.visual_sub}>
            No worries — we&apos;ll send you a reset link in seconds.
          </p>
        </div>
      </div>

      {/* ── Right — form panel ── */}
      <div className={styles.form_panel}>
        <Link href="/" className={styles.back_btn}>
          <span className={styles.back_btn_icon}><HiMiniArrowLongLeft size={14}/></span>
          Back to home
        </Link>

        <div className={styles.form_inner}>
          <div className={styles.form_header}>
            <h1 className={styles.form_title}>Reset your password</h1>
            <p className={styles.form_sub}>
              Enter your email and we&apos;ll send a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            {message && (
              <div className={`${styles.auth_message} ${styles[`auth_message_${message.type}`]}`}>
                <p>{message.text}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="black"
              arrow={false}
              disabled={isPending}
            >
              {isPending ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <p className={styles.form_footer}>
            Remembered it? <Link href="/auth/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
