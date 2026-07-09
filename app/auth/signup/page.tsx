"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "../actions";

export default function SignUpPage() {
  const [role, setRole] = useState<"player" | "manager">("player");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) setMessage({ type: "error",   text: result.error });
      if (result?.success) setMessage({ type: "success", text: result.success });
    });
  }

  return (
    <div className="auth_page">
      <div className="auth_card">
        <div className="auth_header">
          <span className="auth_logo">TURFSKE</span>
          <h1 className="auth_title">Create your account</h1>
          <p className="auth_sub">Join as a player or a turf manager</p>
        </div>

        {/* Role toggle */}
        <div className="auth_role_toggle">
          <button
            type="button"
            className={`auth_role_btn ${role === "player" ? "auth_role_btn_active" : ""}`}
            onClick={() => setRole("player")}
          >
            Player
          </button>
          <button
            type="button"
            className={`auth_role_btn ${role === "manager" ? "auth_role_btn_active" : ""}`}
            onClick={() => setRole("manager")}
          >
            Turf Manager
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth_form">
          <div className="auth_field">
            <label htmlFor="full_name">Full Name</label>
            <input id="full_name" name="full_name" type="text" placeholder="Mark Nthei" required />
          </div>

          <div className="auth_field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>

          <div className="auth_field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Min 8 characters" minLength={8} required />
          </div>

          {message && (
            <p className={`auth_message auth_message_${message.type}`}>
              {message.text}
            </p>
          )}

          <button type="submit" className="auth_submit" disabled={isPending}>
            {isPending ? "Creating account..." : `Sign up as ${role === "player" ? "Player" : "Manager"}`}
          </button>
        </form>

        <p className="auth_footer">
          Already have an account?{" "}
          <Link href="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
