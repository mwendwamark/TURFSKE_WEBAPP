import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import styles from "./Overview.module.css";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  featured?: boolean;
  dot?: "active" | "pending";
  href?: string;
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  featured = false,
  dot,
  href,
}: StatCardProps) {
  const className = [
    styles.stat_card,
    featured ? styles.stat_card_featured : "",
    href ? styles.stat_card_link : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className={styles.stat_bg_icon} aria-hidden="true">
        <Icon size={88} strokeWidth={1.25} />
      </span>
      <span className={styles.stat_label}>{label}</span>
      <span className={styles.stat_value}>
        {dot && (
          <span
            className={`${styles.status_dot} ${
              dot === "active"
                ? styles.status_dot_active
                : styles.status_dot_pending
            }`}
            aria-hidden="true"
          />
        )}
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
