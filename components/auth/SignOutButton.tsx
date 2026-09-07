"use client";

import { useTransition } from "react";
import { signOut } from "@/app/auth/actions";
import Button from "@/components/ui/buttons/Button";

type SignOutButtonProps = {
  className?: string;
};

export default function SignOutButton({ className = "" }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      arrow={false}
      className={className}
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
