"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import styles from "./SignOutButton.module.css";

type SignOutButtonProps = {
  className?: string;
};

export default function SignOutButton({ className = "" }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={`${styles.signout} ${className}`.trim()}
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
    >
      <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
