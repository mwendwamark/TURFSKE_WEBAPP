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
  | "nav_secondary"
  | "danger";

type BaseButtonProps = {
  variant?: ButtonVariant;
  href?: string;
  arrow?: boolean;
  /**
   * Optional leading icon rendered before the label, e.g. `<Plus />`.
   * Decorative — it is hidden from screen readers, so the label still
   * carries the meaning. Supplying an icon replaces the default trailing
   * arrow (pass `arrow` explicitly if you want both).
   */
  icon?: React.ReactNode;
  /**
   * Square, icon-only control (no trailing arrow, no visible label).
   * Keep passing meaningful `children` — they become the visually-hidden
   * accessible name — and add `title` so mouse users get a tooltip.
   */
  iconOnly?: boolean;
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
  icon,
  iconOnly = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const hasIcon = Boolean(icon);

  // outline and danger are text-first actions — no arrow by default, and a
  // leading icon stands in for the arrow rather than stacking with it.
  const defaultArrow = variant !== "outline" && variant !== "danger" && !hasIcon;
  const showArrow = !iconOnly && (arrow !== undefined ? arrow : defaultArrow);

  const classes = [
    styles.btn,
    styles[variant],
    !showArrow ? styles.no_arrow : "",
    iconOnly ? styles.icon_only : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {hasIcon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {iconOnly ? (
        <span className={styles.label_hidden}>{children}</span>
      ) : (
        <span className={styles.label}>{children}</span>
      )}
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