"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import { formatPhoneDisplay } from "@/utils/phone";
import { formatNairobiRange } from "@/utils/datetime";
import { formatKes } from "@/utils/money";
import { checkBookingCodeAction, revealPlayerPhoneAction } from "./actions";
import type {
  CheckBookingCodeResult,
  ManagerBooking,
} from "./types";
import styles from "./Bookings.module.css";

type Tab = "upcoming" | "past";

const NOT_FOUND_MESSAGE =
  "No paid booking with this code at your venues.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function BookingCard({
  booking,
  isUpcoming,
}: {
  booking: ManagerBooking;
  isUpcoming: boolean;
}) {
  const [phone, setPhone] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revealPhone() {
    setLoading(true);
    setError(null);

    try {
      const result = await revealPlayerPhoneAction(booking.booking_id);
      if (result.success) {
        setPhone(result.phone);
        setRevealed(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.codeBlock}>
          <p className={styles.cardLabel}>Booking code</p>
          <p className={styles.code}>{booking.booking_code}</p>
        </div>
        <div className={styles.cardSide}>
          <div className={styles.pills}>
            <span className={`${styles.pill} ${styles.pillPaid}`}>Paid</span>
            <span
              className={`${styles.pill} ${
                isUpcoming ? styles.pillUpcoming : styles.pillCompleted
              }`}
            >
              {isUpcoming ? "Upcoming" : "Completed"}
            </span>
          </div>
          <p className={styles.amount}>
            You receive {formatKes(booking.manager_amount)}
          </p>
        </div>
      </div>

      <div className={styles.cardMain}>
        <h3 className={styles.venue}>{booking.venue_name}</h3>
        <p className={styles.pitch}>{booking.pitch_name}</p>
        <p className={styles.time}>
          {formatNairobiRange(booking.start_time, booking.end_time)}
        </p>
      </div>

      <dl className={styles.details}>
        <div className={styles.detail}>
          <dt>Players</dt>
          <dd>{booking.players ?? 0}</dd>
        </div>
        <div className={styles.detail}>
          <dt>Spectators</dt>
          <dd>{booking.spectators ?? 0}</dd>
        </div>
        <div className={styles.detail}>
          <dt>Player</dt>
          <dd>{booking.player_name ?? "Player"}</dd>
        </div>
        <div className={styles.detail}>
          <dt>Phone</dt>
          <dd>
            {!booking.has_phone ? (
              <span className={styles.muted}>No phone on file</span>
            ) : revealed ? (
              phone ? (
                <span className={styles.phoneRow}>
                  <span>{formatPhoneDisplay(phone)}</span>
                  <Button
                    href={`tel:${phone}`}
                    variant="secondary"
                    arrow={false}
                  >
                    Call
                  </Button>
                </span>
              ) : (
                <span className={styles.muted}>No phone on file</span>
              )
            ) : (
              <span className={styles.phoneRow}>
                <span>{booking.player_phone_masked ?? "Phone unavailable"}</span>
                <Button
                  type="button"
                  variant="outline"
                  arrow={false}
                  onClick={revealPhone}
                  disabled={loading}
                >
                  {loading ? "Revealing..." : "Reveal"}
                </Button>
              </span>
            )}
            {error && (
              <span className={styles.inlineError} role="alert">
                {error}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function ConfirmationCard({
  booking,
  isPast,
}: {
  booking: ManagerBooking;
  isPast: boolean;
}) {
  return (
    <div className={styles.confirm} role="status">
      <div className={styles.confirmHead}>
        <CheckCircle2 className={styles.confirmIcon} size={22} aria-hidden="true" />
        <p className={styles.confirmTitle}>Paid and valid</p>
      </div>

      <p className={styles.confirmCode}>{booking.booking_code}</p>

      <div className={`${styles.pills} ${styles.pillsStart}`}>
        <span className={`${styles.pill} ${styles.pillPaid}`}>Paid</span>
        <span
          className={`${styles.pill} ${
            isPast ? styles.pillCompleted : styles.pillUpcoming
          }`}
        >
          {isPast ? "Completed" : "Upcoming"}
        </span>
      </div>

      <dl className={styles.confirmGrid}>
        <div className={styles.confirmItem}>
          <dt>Venue</dt>
          <dd>{booking.venue_name}</dd>
        </div>
        <div className={styles.confirmItem}>
          <dt>Pitch</dt>
          <dd>{booking.pitch_name}</dd>
        </div>
        <div className={styles.confirmItem}>
          <dt>Time</dt>
          <dd>{formatNairobiRange(booking.start_time, booking.end_time)}</dd>
        </div>
        <div className={styles.confirmItem}>
          <dt>Players</dt>
          <dd>{booking.players ?? 0}</dd>
        </div>
        <div className={styles.confirmItem}>
          <dt>Player</dt>
          <dd>{booking.player_name ?? "Player"}</dd>
        </div>
        <div className={styles.confirmItem}>
          <dt>Phone</dt>
          <dd>
            {booking.has_phone
              ? booking.player_phone_masked ?? "Phone unavailable"
              : "No phone on file"}
          </dd>
        </div>
      </dl>

      {isPast && (
        <p className={styles.pastNotice}>This booking time has passed</p>
      )}
    </div>
  );
}

export default function BookingsClient({
  upcoming,
  past,
}: {
  upcoming: ManagerBooking[];
  past: ManagerBooking[];
}) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckBookingCodeResult | null>(null);

  const bookings = tab === "upcoming" ? upcoming : past;

  async function handleCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim() || checking) return;

    setChecking(true);
    setResult(null);

    try {
      const response = await checkBookingCodeAction(code);
      setResult(response);
    } catch {
      setResult({ status: "error", error: GENERIC_ERROR });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.checkCard} aria-labelledby="check-code-title">
        <div>
          <h2 className={styles.checkTitle} id="check-code-title">
            Check a booking code
          </h2>
          <p className={styles.checkHint}>
            Enter the code a player shows at the venue.
          </p>
        </div>

        <form className={styles.checkForm} onSubmit={handleCheck}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="booking-code">
              Booking code
            </label>
            <input
              id="booking-code"
              className={styles.input}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="e.g. K7M4QX"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            arrow={false}
            disabled={!code.trim() || checking}
          >
            {checking ? "Checking..." : "Check"}
          </Button>
        </form>

        {result?.status === "found" && (
          <ConfirmationCard booking={result.booking} isPast={result.isPast} />
        )}
        {result?.status === "not_found" && (
          <p className={styles.checkMessage} role="status">
            {NOT_FOUND_MESSAGE}
          </p>
        )}
        {result?.status === "error" && (
          <p className={styles.checkError} role="alert">
            {result.error}
          </p>
        )}
      </section>

      <div className={styles.tabs} role="tablist" aria-label="Bookings">
        <Button
          type="button"
          variant={tab === "upcoming" ? "primary" : "outline"}
          arrow={false}
          onClick={() => setTab("upcoming")}
          role="tab"
          aria-selected={tab === "upcoming"}
        >
          Upcoming
        </Button>
        <Button
          type="button"
          variant={tab === "past" ? "primary" : "outline"}
          arrow={false}
          onClick={() => setTab("past")}
          role="tab"
          aria-selected={tab === "past"}
        >
          Past
        </Button>
      </div>

      <div className={styles.list}>
        {bookings.length === 0 ? (
          <p className={styles.empty}>
            {tab === "upcoming"
              ? "No upcoming bookings yet."
              : "No past bookings yet."}
          </p>
        ) : (
          bookings.map((booking) => (
            <BookingCard
              key={booking.booking_id}
              booking={booking}
              isUpcoming={tab === "upcoming"}
            />
          ))
        )}
      </div>
    </div>
  );
}
