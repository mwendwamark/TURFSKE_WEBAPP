import React from "react";
import Link from "next/link";
import styles from "./Button.module.css";
import { ArrowUpRight } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "white"
  | "glass"
  | "outline"
  | "black"
  | "black_outline"
  | "nav_secondary";

type BaseButtonProps = {
  variant?: ButtonVariant;
  href?: string;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

export type ButtonProps = BaseButtonProps &
  (
    | React.AnchorHTMLAttributes<HTMLAnchorElement>
    | React.ButtonHTMLAttributes<HTMLButtonElement>
  );

export default function Button({
  variant = "primary",
  href,
  arrow,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const showArrow =
    arrow !== undefined ? arrow : variant !== "outline";

  const classes = [
    styles.btn,
    styles[variant],
    !showArrow ? styles.no_arrow : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className={styles.label}>{children}</span>
      {showArrow && (
        <span className={styles.arrow} aria-hidden="true">
          <ArrowUpRight />
        </span>
      )}
    </>
  );

  if (!href) {
    const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;

    return (
      <button className={classes} {...buttonProps}>
        {content}
      </button>
    );
  }

  const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;

  return (
    <Link href={href} className={classes} {...anchorProps}>
      {content}
    </Link>
  );
}