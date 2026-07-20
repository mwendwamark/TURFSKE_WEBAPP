"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { signUp } from "../actions";
import styles from "../Auth.module.css";
import turfImage from "@/assets/home/turf3.webp";
import { signInWithGoogle } from "../actions";
import { HiMiniArrowLongLeft } from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

export default function SignUpPage() {
  const [role, setRole] = useState<"player" | "manager">("player");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
    showLogin?: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) {
        const showLogin =
          result.error.toLowerCase().includes("sign in") ||
          result.error.toLowerCase().includes("already");
        setMessage({ type: "error", text: result.error, showLogin });
      }
      if (result?.success) {
        setMessage({ type: "success", text: result.success });
      }
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

        {/* Brand mark top-left */}
        <div className={styles.visual_brand}>
          <Link href="/" className={styles.visual_logo_text}>
            TURFSKE
          </Link>
        </div>

        {/* Bottom tagline */}
        <div className={styles.visual_content}>
          <h2 className={styles.visual_tagline}>
            Find and book the perfect pitch near you
          </h2>
          <p className={styles.visual_sub}>
            TurfsKE connects players with quality turf managers across Kenya —
            all in one place.
          </p>
        </div>
      </div>

      {/* ── Right — form panel ── */}
      <div className={styles.form_panel}>
        {/* Back to home */}
        <Link href="/" className={styles.back_btn}>
          <span className={styles.back_btn_icon}><HiMiniArrowLongLeft size={14}/> </span>
          Back to home
        </Link>

        <div className={styles.form_inner}>
          {/* Header */}
          <div className={styles.form_header}>
            <h1 className={styles.form_title}>Create an Account</h1>
            <p className={styles.form_sub}>
              You are a few moments away from getting started!
            </p>
          </div>

          {/* Role toggle */}
          <div className={styles.role_toggle}>
            <button
              type="button"
              className={`${styles.role_btn} ${role === "player" ? styles.role_btn_active : ""}`}
              onClick={() => setRole("player")}
            >
              Player
            </button>
            <button
              type="button"
              className={`${styles.role_btn} ${role === "manager" ? styles.role_btn_active : ""}`}
              onClick={() => setRole("manager")}
            >
              Turf Manager
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Mark Nthei"
                required
              />
            </div>

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
                  placeholder="Min 8 characters"
                  minLength={8}
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

            {message && (
              <div
                className={`${styles.message} ${styles[`message_${message.type}`]}`}
              >
                <p>{message.text}</p>
                {message.showLogin && (
                  <p>
                    <Link href="/auth/login">Go to sign in →</Link>
                  </p>
                )}
              </div>
            )}

            <p className={styles.terms}>
              By signing up, you accept TurfsKE&apos;s{" "}
              <Link href="/privacy">privacy policy</Link> and{" "}
              <Link href="/terms">terms of service</Link>.
            </p>

            <button
              type="submit"
              className={styles.submit_btn}
              disabled={isPending}
            >
              {isPending
                ? "Creating account..."
                : `Sign up as ${role === "player" ? "Player" : "Turf Manager"}`}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>or</div>

          {/* OAuth */}
          <div className={styles.oauth_group}>
            <form action={signInWithGoogle}>
              <button type="submit" className={styles.oauth_btn}>
                <FcGoogle className={styles.oauth_icon} />
                  
                
                Continue with Google
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className={styles.form_footer}>
            Already have an account? <Link href="/auth/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
