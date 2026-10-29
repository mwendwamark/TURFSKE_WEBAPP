import type { ReactNode } from "react";
import { Check } from "lucide-react";
import styles from "./ReceiptPrinter.module.css";

export type PrinterStage = "processing" | "printing" | "complete";

type ReceiptPrinterProps = {
  stage: PrinterStage;
  /** Shown on the printer screen, e.g. "Pitch Palace, Alfa". */
  title: string;
  subtitle?: string;
  amount?: string;
  /** The receipt that feeds out of the printer. */
  children?: ReactNode;
};

const STATUS: Record<PrinterStage, string> = {
  processing: "Confirming your payment",
  printing: "Printing your receipt",
  complete: "Payment confirmed",
};

// Torn paper edge: a zigzag along the bottom of the paper.
const TEETH = 22;
const DEPTH = 6;

function buildPaperClip(): string {
  const points: string[] = [];
  for (let i = 0; i <= TEETH * 2; i += 1) {
    const x = 100 - (i * 100) / (TEETH * 2);
    const y = i % 2 === 0 ? `calc(100% - ${DEPTH}px)` : "100%";
    points.push(`${x}% ${y}`);
  }
  return `polygon(0 0, 100% 0, ${points.join(", ")})`;
}

const PAPER_CLIP = buildPaperClip();

export function ReceiptPrinter({
  stage,
  title,
  subtitle,
  amount,
  children,
}: ReceiptPrinterProps) {
  const feedClass =
    stage === "printing"
      ? styles.feed_printing
      : stage === "complete"
        ? styles.feed_complete
        : "";

  return (
    <section className={styles.root} data-stage={stage} aria-label="Receipt printer">
      <div className={styles.machine}>
        <div className={styles.machine_head}>
          <span className={styles.brand}>TURFSKE</span>
          <span className={styles.led} aria-hidden="true" />
        </div>

        <div className={styles.screen}>
          <div className={styles.screen_row}>
            <div className={styles.screen_text}>
              <p className={styles.screen_title}>{title}</p>
              {subtitle && <p className={styles.screen_sub}>{subtitle}</p>}
            </div>
            {amount && <p className={styles.screen_amount}>{amount}</p>}
          </div>

          <div className={styles.status} role="status" aria-live="polite">
            {stage === "complete" ? (
              <Check size={15} className={styles.status_check} aria-hidden="true" />
            ) : (
              <span className={styles.spinner} aria-hidden="true" />
            )}
            <span>{STATUS[stage]}</span>
          </div>
        </div>

        <span className={styles.lip} aria-hidden="true" />
      </div>

      {stage !== "processing" && (
        <div className={styles.slot}>
          <div className={`${styles.feed} ${feedClass}`}>
            <div className={styles.paper} style={{ clipPath: PAPER_CLIP }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}