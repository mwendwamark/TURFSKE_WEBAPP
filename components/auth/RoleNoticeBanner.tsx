"use client";

import { useState, type ReactNode } from "react";
import authStyles from "@/app/auth/Auth.module.css";

type RoleNoticeBannerProps = {
  /** Existing-key form ("existing_role_manager" | "existing_role_player")
   *  used by the dashboard's Google OAuth role-mismatch notice. */
  notice?: string;
  /**
   * Fully custom message, e.g. the venue detail page's
   * "This account is registered as a Manager — create a separate
   * player account to book a pitch." Takes precedence over `notice`.
   */
  message?: ReactNode;
};

// Rendered when the OAuth callback detected an intended role that conflicts
// with the account's existing profile role. Information only — the user is
// already signed in with their existing role and landed on their real dashboard.
// Also used (with a custom `message`) wherever the same inline
// "your account's role means you can't do this" pattern is needed.
export default function RoleNoticeBanner({ notice, message }: RoleNoticeBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  const existingRole =
    notice === "existing_role_manager" ? "Manager" : "Player";

  return (
    <div
      className={`${authStyles.auth_message} ${authStyles.auth_message_success}`}
      role="status"
    >
      <div className={authStyles.auth_message_row}>
        <p className={authStyles.auth_message_text}>
          {message ?? (
            <>
              This account is already registered as a{" "}
              <strong>{existingRole}</strong> — you&apos;ve been signed in with
              your existing account.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss notice"
          className={authStyles.auth_message_dismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
