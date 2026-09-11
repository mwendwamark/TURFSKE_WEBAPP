"use client";

import { useState } from "react";
import authStyles from "@/app/auth/Auth.module.css";

type RoleNoticeBannerProps = {
  notice: string;
};

// Rendered when the OAuth callback detected an intended role that conflicts
// with the account's existing profile role. Information only — the user is
// already signed in with their existing role and landed on their real dashboard.
export default function RoleNoticeBanner({ notice }: RoleNoticeBannerProps) {
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
          This account is already registered as a{" "}
          <strong>{existingRole}</strong> — you&apos;ve been signed in with your
          existing account.
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