"use client";

import { useTransition } from "react";
import { signOut } from "@/app/auth/actions";

export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="signout_btn"
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}