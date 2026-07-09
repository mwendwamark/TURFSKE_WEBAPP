"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { forgotPassword } from "../actions";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await forgotPassword(formData);
      if (result?.error)   setMessage({ type: "error",   text: result.error });
      if (result?.success) setMessage({ type: "success", text: result.success });
    });
  }

  return (
    <div className="auth_page">
      <div className="auth_card">
        <div className="auth_header">
          <span className="auth_logo">TURFSKE</span>
          <h1 className="auth_title">Reset your password</h1>
          <p className="auth_sub">We&apos;ll send a reset link to your email</p>
        </div>

        <form onSubmit={handleSubmit} className="auth_form">
          <div className="auth_field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>

          {message && (
            <p className={`auth_message auth_message_${message.type}`}>
              {message.text}
            </p>
          )}

          <button type="submit" className="auth_submit" disabled={isPending}>
            {isPending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="auth_footer">
          Remembered it?{" "}
          <Link href="/auth/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}