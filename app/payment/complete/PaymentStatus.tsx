"use client";

import { useEffect, useState, type ReactNode } from "react";
import Button from "@/components/ui/buttons/Button";
import { createClient } from "@/utils/supabase/client";
import styles from "./PaymentStatus.module.css";

type PaymentRow = {
  reference: string;
  status: string;
  bookings: {
    status: string;
    refund_required: boolean;
    start_time: string;
    end_time: string;
    total_amount: number;
    pitches: { name: string; venues: { name: string } | null } | null;
  } | null;
};

type LoadState = "loading" | "ready" | "not_found" | "error";

const POLL_MS = 3000;
const GIVE_UP_MS = 90_000;
const TZ = "Africa/Nairobi";

function formatRange(startIso: string, endIso: string): string {
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(startIso));
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day}, ${time.format(new Date(startIso))} to ${time.format(new Date(endIso))}`;
}

export function PaymentStatus({ reference }: { reference: string }) {
  const [row, setRow] = useState<PaymentRow | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();
    const supabase = createClient();

    async function poll() {
      const { data, error } = await supabase
        .from("booking_payments")
        .select(
          "reference, status, bookings(status, refund_required, start_time, end_time, total_amount, pitches(name, venues(name)))",
        )
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

      const next = data as unknown as PaymentRow;
      setRow(next);
      setState("ready");

      const done =
        next.bookings?.status === "confirmed" ||
        next.bookings?.refund_required === true;
      if (done) return;

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
  const confirmed = booking?.status === "confirmed";
  const refund = booking?.refund_required === true;

  let content: ReactNode;

  if (state === "error") {
    content = (
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
    content = (
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
    content = (
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
  } else if (confirmed && booking) {
    content = (
      <>
        <p className={styles.success_title}>Booking confirmed</p>
        <div className={styles.details}>
          <div className={styles.row}>
            <span className={styles.row_label}>Venue</span>
            <span>{booking.pitches?.venues?.name ?? "Venue"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.row_label}>Pitch</span>
            <span>{booking.pitches?.name ?? "Pitch"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.row_label}>When</span>
            <span>{formatRange(booking.start_time, booking.end_time)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.row_label}>Paid</span>
            <span>KES {Number(booking.total_amount).toLocaleString()}</span>
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" href="/explore">
            Back to Explore
          </Button>
          <Button variant="primary" href="/dashboard">
            Go to dashboard
          </Button>
        </div>
      </>
    );
  } else if (timedOut) {
    content = (
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
  } else {
    content = <p className={`${styles.status_text} ${styles.pulse}`}>Confirming your payment...</p>;
  }

  return (
    <div className={`section ${styles.wrap}`}>
      <div className={styles.card}>
        <h1 className={styles.title}>Payment</h1>
        {content}
      </div>
    </div>
  );
}