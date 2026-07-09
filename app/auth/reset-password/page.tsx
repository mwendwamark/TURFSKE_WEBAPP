"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPassword } from "../actions";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await resetPassword(formData);
      } catch {
        // redirect happens on success, error is returned
      }
    });
  }

  return (
    <div className="auth_page">
      <div className="auth_card">
        <div className="auth_header">
          <span className="auth_logo">TURFSKE</span>
          <h1 className="auth_title">Set new password</h1>
          <p className="auth_sub">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="auth_form">
          <div className="auth_field">
            <label htmlFor="password">New Password</label>
            <input id="password" name="password" type="password" placeholder="Min 8 characters" minLength={8} required />
          </div>

          {message && (
            <p className={`auth_message auth_message_${message.type}`}>
              {message.text}
            </p>
          )}

          <button type="submit" className="auth_submit" disabled={isPending}>
            {isPending ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="auth_footer">
          <Link href="/auth/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
