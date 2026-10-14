"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import { createClient } from "@/utils/supabase/client";
import type { Pitch } from "@/app/dashboard/types";
import styles from "./BookingPanel.module.css";

const TZ = "Africa/Nairobi";
const HOUR_MS = 3_600_000;

type BookedRange = { start: number; end: number };
type FetchResult = { key: string; booked: BookedRange[]; error: string | null };
type Held = { expiresAt: number; label: string; expired: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

// "2026-10-13" in Nairobi, regardless of the browser's timezone.
function nairobiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayLabel(day: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${day}T12:00:00+03:00`));
}

function slotStartMs(day: string, hour: number): number {
  return new Date(`${day}T${pad(hour)}:00:00+03:00`).getTime();
}

function slotLabel(hour: number): string {
  return `${pad(hour)}:00 to ${pad(hour + 1)}:00`;
}

// Whole-hour slots that fit fully inside the opening window.
function openHours(pitch: Pitch): number[] {
  const [oh, om] = (pitch.opens_at || "06:00").split(":").map(Number);
  const [ch] = (pitch.closes_at || "22:00").split(":").map(Number);
  const first = om > 0 ? oh + 1 : oh;
  const hours: number[] = [];
  for (let h = first; h < ch; h += 1) hours.push(h);
  return hours;
}

const ERRORS: [string, string][] = [
  ["slot_taken", "Someone just took that slot. Pick another."],
  ["too_many_pending", "You already have 3 held slots. Wait for them to expire."],
  ["slot_in_past", "That time has already passed."],
  ["outside_opening_hours", "That slot is outside this pitch's opening hours."],
  ["pitch_unavailable", "This pitch isn't available right now."],
  ["pitch_has_no_price", "This pitch has no price set yet."],
  ["only_players_can_book", "Only player accounts can book."],
  ["not_authenticated", "Please log in to book."],
];

function friendlyError(message: string): string {
  const hit = ERRORS.find(([code]) => message.includes(code));
  if (hit) return hit[1];
  console.error("create_booking failed:", message);
  return "Something went wrong. Try again.";
}

type BookingPanelProps = {
  pitch: Pitch;
  onClose: () => void;
};

export default function BookingPanel({ pitch, onClose }: BookingPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [today] = useState(nairobiToday);
  const [date, setDate] = useState(today);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [held, setHeld] = useState<Held | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const dates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(today, i)),
    [today],
  );
  const hours = useMemo(() => openHours(pitch), [pitch]);

  // Load taken slots for this pitch and day.
  const requestKey = `${pitch.id}|${date}|${reloadKey}`;
  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc("get_booked_slots", { p_pitch_id: pitch.id, p_day: date })
      .then(({ data, error }) => {
        if (cancelled) return;
        const rows = (data ?? []) as { start_time: string; end_time: string }[];
        setResult({
          key: requestKey,
          booked: rows.map((r) => ({
            start: new Date(r.start_time).getTime(),
            end: new Date(r.end_time).getTime(),
          })),
          error: error ? error.message : null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, pitch.id, date, requestKey]);

  const loading = result?.key !== requestKey;
  const loadError = !loading ? result?.error ?? null : null;
  const booked = !loading && result ? result.booked : [];

  // Clock: ticks every second while a hold is live, otherwise every 30s
  // so slots that pass during the session grey out.
  useEffect(() => {
    const live = held !== null && !held.expired;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (held && !held.expired && t >= held.expiresAt) {
        setHeld({ ...held, expired: true });
        setReloadKey((k) => k + 1);
      }
    }, live ? 1000 : 30000);
    return () => clearInterval(id);
  }, [held]);

  async function holdSlot() {
    if (selectedHour === null || holding) return;
    const start = slotStartMs(date, selectedHour);
    setHolding(true);
    setHoldError(null);

    const { data, error } = await supabase.rpc("create_booking", {
      p_pitch_id: pitch.id,
      p_start: new Date(start).toISOString(),
      p_end: new Date(start + HOUR_MS).toISOString(),
    });
    setHolding(false);

    if (error) {
      setHoldError(friendlyError(error.message));
      if (error.message.includes("slot_taken")) {
        setSelectedHour(null);
        setReloadKey((k) => k + 1);
      }
      return;
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | { hold_expires_at?: string }
      | null;
    const expiresAt = row?.hold_expires_at
      ? new Date(row.hold_expires_at).getTime()
      : Date.now() + 10 * 60 * 1000;

    setHeld({
      expiresAt,
      label: `${dayLabel(date)}, ${slotLabel(selectedHour)}`,
      expired: false,
    });
    setNow(Date.now());
    setSelectedHour(null);
    setReloadKey((k) => k + 1);
  }

  const remaining =
    held && !held.expired
      ? Math.max(0, Math.ceil((held.expiresAt - now) / 1000))
      : 0;
  const unavailable = loading || Boolean(loadError);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.title}>Book {pitch.name}</p>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close booking panel"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.dates} role="group" aria-label="Choose a date">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            className={`${styles.date_btn} ${d === date ? styles.date_btn_active : ""}`}
            aria-pressed={d === date}
            onClick={() => {
              setDate(d);
              setSelectedHour(null);
              setHoldError(null);
            }}
          >
            {dayLabel(d)}
          </button>
        ))}
      </div>

      {hours.length === 0 ? (
        <p className={styles.status}>No bookable hours for this pitch.</p>
      ) : (
        <>
          {loading && <p className={styles.status}>Loading slots...</p>}

          {loadError && (
            <div className={styles.error} role="alert">
              <p>Couldn&apos;t load availability. Check your connection.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                Retry
              </Button>
            </div>
          )}

          <div className={styles.slots}>
            {hours.map((h) => {
              const start = slotStartMs(date, h);
              const taken = booked.some(
                (b) => start < b.end && start + HOUR_MS > b.start,
              );
              const past = start <= now;
              const selected = selectedHour === h;
              const cls = [
                styles.slot,
                selected ? styles.slot_selected : "",
                taken ? styles.slot_taken : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={h}
                  type="button"
                  className={cls}
                  disabled={unavailable || taken || past}
                  aria-pressed={selected}
                  title={
                    taken ? "Already taken" : past ? "This time has passed" : undefined
                  }
                  onClick={() => {
                    setSelectedHour(h);
                    setHoldError(null);
                  }}
                >
                  {slotLabel(h)}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedHour !== null && (
        <div className={styles.summary}>
          <p className={styles.summary_line}>
            {pitch.name}, {dayLabel(date)}, {slotLabel(selectedHour)}
          </p>
          <p className={styles.summary_meta}>
            {pitch.price_per_hour != null
              ? `KES ${pitch.price_per_hour.toLocaleString()} for 1 hour`
              : "1 hour"}
          </p>
          <Button
            type="button"
            variant="primary"
            arrow={false}
            onClick={holdSlot}
            disabled={holding}
          >
            {holding ? "Holding..." : "Hold this slot"}
          </Button>
        </div>
      )}

      {holdError && (
        <p className={styles.error} role="alert">
          {holdError}
        </p>
      )}

      {held && (
        <div className={styles.held}>
          {held.expired ? (
            <p className={styles.held_title}>Hold expired. Pick a slot to try again.</p>
          ) : (
            <>
              <p className={styles.held_title}>
                Slot held, expires in {Math.floor(remaining / 60)}:{pad(remaining % 60)}
              </p>
              <p className={styles.summary_meta}>
                {held.label}. Online payment is coming soon, so this hold will expire.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}