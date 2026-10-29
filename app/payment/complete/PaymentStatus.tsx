"use client";

import { useEffect, useState, type ReactNode } from "react";
import Button from "@/components/ui/buttons/Button";
import { createClient } from "@/utils/supabase/client";
import {
  ReceiptPrinter,
  type PrinterStage,
} from "@/components/receipt/ReceiptPrinter";
import ReceiptDocument from "@/components/receipt/ReceiptDocument";
import {
  RECEIPT_SELECT,
  formatRange,
  isPaidRow,
  kes,
  toReceiptData,
  type ReceiptPaymentRow,
} from "@/components/receipt/receipt-data";
import styles from "./PaymentStatus.module.css";

type LoadState = "loading" | "ready" | "not_found" | "error";

const POLL_MS = 3000;
const GIVE_UP_MS = 90_000;
const PRINT_MS = 2000;

type PaymentStatusProps = {
  reference: string;
  payerName: string | null;
  payerEmail: string | null;
};

export function PaymentStatus({
  reference,
  payerName,
  payerEmail,
}: PaymentStatusProps) {
  const [row, setRow] = useState<ReceiptPaymentRow | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();
    const supabase = createClient();

    async function poll() {
      const { data, error } = await supabase
        .from("booking_payments")
        .select(RECEIPT_SELECT)
        .eq("reference", reference)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Payment status error:", error.message);
        setState("error");
        return;
      }
      if (!data) {
        setState("not_found");
        return;
      }

      const next = data as unknown as ReceiptPaymentRow;
      setRow(next);
      setState("ready");

      if (isPaidRow(next) || next.bookings?.refund_required === true) return;

      if (Date.now() - started >= GIVE_UP_MS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reference, attempt]);

  const booking = row?.bookings ?? null;
  const paid = row ? isPaidRow(row) : false;
  const refund = booking?.refund_required === true;

  // Once the payment is confirmed the paper feeds out, then we mark it done.
  useEffect(() => {
    if (!paid) return;
    const timer = setTimeout(() => setPrinted(true), PRINT_MS);
    return () => clearTimeout(timer);
  }, [paid]);

  let message: ReactNode = null;

  if (state === "error") {
    message = (
      <>
        <p className={styles.status_text}>
          We couldn&apos;t check your payment. Check your connection and try again.
        </p>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setState("loading");
              setAttempt((a) => a + 1);
            }}
          >
            Retry
          </Button>
        </div>
      </>
    );
  } else if (state === "not_found") {
    message = (
      <>
        <p className={styles.status_text}>We couldn&apos;t find this payment.</p>
        <div className={styles.actions}>
          <Button variant="outline" href="/explore">
            Back to Explore
          </Button>
        </div>
      </>
    );
  } else if (refund) {
    message = (
      <>
        <p className={styles.status_text}>
          We received your payment but the slot is no longer available. We will
          refund you. Contact support if you don&apos;t hear from us.
        </p>
        <div className={styles.actions}>
          <Button variant="outline" href="/explore">
            Back to Explore
          </Button>
        </div>
      </>
    );
  } else if (timedOut && !paid) {
    message = (
      <>
        <p className={styles.status_text}>
          We haven&apos;t received confirmation yet. If money left your M-Pesa,
          don&apos;t pay again. Wait a few minutes and refresh this page.
        </p>
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button variant="outline" href="/explore">
            Back to Explore
          </Button>
        </div>
      </>
    );
  }

  if (message) {
    return (
      <div className={`section ${styles.wrap}`}>
        <div className={styles.card}>
          <h1 className={styles.title}>Payment</h1>
          {message}
        </div>
      </div>
    );
  }

  // Printer view: waiting, printing or done.
  const stage: PrinterStage = !paid ? "processing" : printed ? "complete" : "printing";
  const receipt =
    row && paid
      ? toReceiptData(row, { name: payerName, email: payerEmail })
      : null;

  const title = booking
    ? `${booking.pitches?.venues?.name ?? "Venue"}, ${booking.pitches?.name ?? "Pitch"}`
    : "Checking your payment";
  const subtitle = booking
    ? formatRange(booking.start_time, booking.end_time)
    : undefined;
  const amount = booking ? kes(Number(booking.total_amount)) : undefined;

  return (
    <div className={`section ${styles.wrap}`}>
      <div className={styles.printer_wrap}>
        <ReceiptPrinter
          stage={stage}
          title={title}
          subtitle={subtitle}
          amount={amount}
        >
          {receipt && <ReceiptDocument data={receipt} />}
        </ReceiptPrinter>

        {stage === "complete" && (
          <div className={styles.actions}>
            <Button
              variant="primary"
              arrow={false}
              href={`/payment/receipt?reference=${encodeURIComponent(reference)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Print or save receipt
            </Button>
            <Button variant="outline" href="/explore">
              Back to Explore
            </Button>
            <Button variant="outline" href="/dashboard">
              Go to dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}