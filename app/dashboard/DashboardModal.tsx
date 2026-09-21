"use client";

import { useEffect, type ReactNode } from "react";
import styles from "./ManagerDashboard.module.css";

type DashboardModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function DashboardModal({
  title,
  description,
  onClose,
  children,
}: DashboardModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className={styles.modal_overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.modal_head}>
          <div>
            <h3 className={styles.modal_title}>{title}</h3>
            {description && <p className={styles.modal_sub}>{description}</p>}
          </div>
          <button
            type="button"
            className={styles.modal_close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}