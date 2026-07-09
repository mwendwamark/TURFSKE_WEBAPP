"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "../actions";

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setMessage(result.error);
    });
  }

  return (
    <div className="auth_page">
      <div className="auth_card">
        <div className="auth_header">
          <span className="auth_logo">TURFSKE</span>
          <h1 className="auth_title">Welcome back</h1>
          <p className="auth_sub">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth_form">
          <div className="auth_field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth_field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              required
            />
          </div>

          <div className="auth_forgot">
            <Link href="/auth/forgot-password">Forgot password?</Link>
          </div>

          {message && (
            <p className="auth_message auth_message_error">{message}</p>
          )}

          <button type="submit" className="auth_submit" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth_footer">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
