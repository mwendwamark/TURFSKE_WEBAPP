"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/buttons/Button";
import { formatNairobiRange } from "@/utils/datetime";
import { formatKes } from "@/utils/money";
import { formatPhoneDisplay } from "@/utils/phone";
import type { PlayerBooking } from "./player-types";
import styles from "./PlayerBookings.module.css";

type Tab = "upcoming" | "past";

function playerBadge(booking: PlayerBooking, isUpcoming: boolean) {
  if (booking.refund_required) {
    return { label: "Refund in progress", className: styles.pillRefund };
  }
  if (booking.status === "confirmed" && isUpcoming) {
    return { label: "Confirmed", className: styles.pillConfirmed };
  }
  if (booking.status === "completed" || !isUpcoming) {
    return { label: "Completed", className: styles.pillCompleted };
  }
  return null;
}

function PlayerBookingCard({
  booking,
  isUpcoming,
}: {
  booking: PlayerBooking;
  isUpcoming: boolean;
}) {
  const badge = playerBadge(booking, isUpcoming);

  return (
    <article
      className={`${styles.card} ${booking.refund_required ? styles.cardRefund : ""}`}
    >
      <div className={styles.cardHead}>
        <div className={styles.cardMain}>
          <h3 className={styles.venue}>
            <Link
              href={`/dashboard/explore/${booking.venue_slug}`}
              className={styles.venueLink}
            >
              {booking.venue_name}
            </Link>
          </h3>
          <p className={styles.pitch}>{booking.pitch_name}</p>
          <p className={styles.time}>
            {formatNairobiRange(booking.start_time, booking.end_time)}
          </p>
        </div>
        <div className={styles.cardSide}>
          {badge && (
            <span className={`${styles.pill} ${badge.className}`}>
              {badge.label}
            </span>
          )}
          <p className={styles.amount}>Paid {formatKes(booking.total_amount)}</p>
        </div>
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
      </dl>

      {booking.refund_required ? (
        <p className={styles.refundNotice} role="status">
          We received your payment but this slot was no longer available. Your
          refund is being processed.
        </p>
      ) : (
        <>
          <div className={styles.codeBlock}>
            <p className={styles.codeLabel}>Booking code</p>
            <p className={styles.code}>{booking.booking_code}</p>
            <p className={styles.codeHint}>Show this code at the venue</p>
          </div>

          <div className={styles.contact}>
            <p className={styles.contactLabel}>Venue contact</p>
            <p className={styles.contactName}>
              {booking.manager_name ?? "Venue contact"}
            </p>
            {booking.manager_phone ? (
              <p className={styles.phoneRow}>
                <span>{formatPhoneDisplay(booking.manager_phone)}</span>
                <Button
                  href={`tel:${booking.manager_phone}`}
                  variant="secondary"
                  arrow={false}
                >
                  Call
                </Button>
              </p>
            ) : (
              <p className={styles.muted}>Contact not available</p>
            )}
          </div>
        </>
      )}

      {booking.paid_reference && (
        <div className={styles.actions}>
          <Button
            variant="outline"
            href={`/payment/receipt?reference=${encodeURIComponent(booking.paid_reference)}`}
            target="_blank"
            rel="noopener noreferrer"
            arrow={false}
          >
            View receipt
          </Button>
        </div>
      )}
    </article>
  );
}

export default function PlayerBookingsClient({
  upcoming,
  past,
}: {
  upcoming: PlayerBooking[];
  past: PlayerBooking[];
}) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const bookings = tab === "upcoming" ? upcoming : past;

  return (
    <div className={styles.page}>
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
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {tab === "upcoming"
                ? "No upcoming bookings yet."
                : "No past bookings yet."}
            </p>
            <p className={styles.emptyText}>
              {tab === "upcoming"
                ? "Find a pitch and your booking will show up here."
                : "Your completed bookings will show up here."}
            </p>
            <Button href="/dashboard/explore" variant="primary" arrow={false}>
              Find a pitch
            </Button>
          </div>
        ) : (
          bookings.map((booking) => (
            <PlayerBookingCard
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
