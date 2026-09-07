"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { resetPassword } from "../actions";
import Button from "@/components/ui/buttons/Button";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import styles from "../Auth.module.css";
import turfImage from "@/assets/home/turf3.webp";
import { HiMiniArrowLongLeft } from "react-icons/hi2";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  // If someone lands here without a recovery session (stale/expired link,
  // or the raw ?code= link from an older email), surface a clear message
  // instead of letting the server action fail with "Auth session missing".
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setMessage({
          type: "error",
          text: "This reset link is invalid or has expired. Please request a new reset link.",
        });
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await resetPassword(formData);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
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

        <div className={styles.visual_brand}>
          <Link href="/" className={styles.visual_logo_text}>
            TURFSKE
          </Link>
        </div>

        <div className={styles.visual_content}>
          <h2 className={styles.visual_tagline}>Set a new password</h2>
          <p className={styles.visual_sub}>
            You&apos;re almost there — choose something strong and memorable.
          </p>
        </div>
      </div>

      {/* ── Right — form panel ── */}
      <div className={styles.form_panel}>
        <Link href="/auth/login" className={styles.back_btn}>
          <span className={styles.back_btn_icon}><HiMiniArrowLongLeft size={14}/></span>
          Back to sign in
        </Link>

        <div className={styles.form_inner}>
          <div className={styles.form_header}>
            <h1 className={styles.form_title}>Set new password</h1>
            <p className={styles.form_sub}>
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="password">New Password</label>
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
              {isPending ? "Resetting..." : "Reset password"}
            </Button>
          </form>

          <p className={styles.form_footer}>
            <Link href="/auth/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
