"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "../actions";
import styles from "../Auth.module.css";
import turfImage from "@/assets/home/turf3.webp";
import { signInWithGoogle } from "../actions";
import { HiMiniArrowLongLeft } from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

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
          <Link href="/" className={styles.visual_logo_text}>
            TURFSKE
          </Link>
        </div>

        <div className={styles.visual_content}>
          <h2 className={styles.visual_tagline}>Welcome back to TurfsKE</h2>
          <p className={styles.visual_sub}>
            Book a pitch or manage your venue — sign in to continue.
          </p>
        </div>
      </div>

      {/* ── Right — form panel ── */}
      <div className={styles.form_panel}>
        {/* Back to home */}
        <Link href="/" className={styles.back_btn}>
          <span className={styles.back_btn_icon}> <HiMiniArrowLongLeft size={14}/> </span>
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
              <div className={styles.password_field}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.password_toggle}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <IoEyeOffOutline size={20} />
                  ) : (
                    <IoEyeOutline size={20} />
                  )}
                </button>
              </div>
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
            <form action={signInWithGoogle}>
              <button type="submit" className={styles.oauth_btn}>
                <FcGoogle className={styles.oauth_icon}/>
                
                Continue with Google
              </button>
            </form>
          </div>

          <p className={styles.form_footer}>
            Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
