"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "../actions";
import styles from "../Auth.module.css";
import turfImage from "@/assets/home/turf3.webp";

export default function LoginPage() {
  const [message, setMessage]        = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setMessage(result.error);
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
          <Link href="/" className={styles.visual_logo_text}>TURFSKE</Link>
        </div>

        <div className={styles.visual_content}>
          <h2 className={styles.visual_tagline}>
            Welcome back to TurfsKE
          </h2>
          <p className={styles.visual_sub}>
            Book a pitch or manage your venue — sign in to continue.
          </p>
        </div>
      </div>

      {/* ── Right — form panel ── */}
      <div className={styles.form_panel}>

        {/* Back to home */}
        <Link href="/" className={styles.back_btn}>
          <span className={styles.back_btn_icon}>←</span>
          Back to home
        </Link>

        <div className={styles.form_inner}>

          <div className={styles.form_header}>
            <h1 className={styles.form_title}>Welcome back</h1>
            <p className={styles.form_sub}>
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••••"
                required
              />
            </div>

            <div className={styles.forgot}>
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </div>

            {message && (
              <div className={`${styles.message} ${styles.message_error}`}>
                <p>{message}</p>
              </div>
            )}

            <button
              type="submit"
              className={styles.submit_btn}
              disabled={isPending}
            >
              {isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className={styles.divider}>or</div>

          <div className={styles.oauth_group}>
            <button type="button" className={styles.oauth_btn}>
              <svg className={styles.oauth_icon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className={styles.form_footer}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup">Sign up</Link>
          </p>

        </div>
      </div>
    </div>
  );
}