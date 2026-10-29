"use client";

import Button from "@/components/ui/buttons/Button";
import styles from "./receipt.module.css";

export default function ReceiptToolbar() {
  return (
    <>
      <div className={styles.toolbar}>
        <Button type="button" variant="primary" arrow={false} onClick={() => window.print()}>
          Print or save as PDF
        </Button>
        <Button variant="outline" href="/dashboard">
          Back to dashboard
        </Button>
      </div>
      <p className={styles.hint}>
        To save a PDF, choose &quot;Save as PDF&quot; as the destination in the print window.
      </p>
    </>
  );
}