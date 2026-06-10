import React from "react";
import Link from "next/link";
import styles from "./Button.module.css";
import { ArrowUpRight } from "lucide-react";

export interface ButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "secondary" | "white" | "glass" | "outline";
  href?: string;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  href = "/",
  arrow,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const showArrow =
    arrow !== undefined ? arrow : variant !== "outline";

  const classes = [styles.btn, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={href} className={classes} {...rest}>
      <span className={styles.label}>{children}</span>
      {showArrow && (
        <span className={styles.arrow} aria-hidden="true">
          {/* <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg> */}
          <ArrowUpRight/>
        </span>
      )}
    </Link>
  );
}