const TZ = "Africa/Nairobi";

export const RECEIPT_SELECT =
  "reference, status, bookings(status, refund_required, start_time, end_time, total_amount, pricing_model, players, spectators, pitch_amount, spectator_amount, spectator_fee_snapshot, price_snapshot, paid_at, pitches(name, venues(name)))";

type Money = number | string | null;

export type ReceiptPaymentRow = {
  reference: string;
  status: string;
  bookings: {
    status: string;
    refund_required: boolean;
    start_time: string;
    end_time: string;
    total_amount: Money;
    pricing_model: "per_pitch" | "per_person" | null;
    players: number | null;
    spectators: number | null;
    pitch_amount: Money;
    spectator_amount: Money;
    spectator_fee_snapshot: Money;
    price_snapshot: Money;
    paid_at: string | null;
    pitches: { name: string; venues: { name: string } | null } | null;
  } | null;
};

export type ReceiptLine = { label: string; amount: number };

export type ReceiptData = {
  reference: string;
  paidAt: string | null;
  payerName: string | null;
  payerEmail: string | null;
  venueName: string;
  pitchName: string;
  startIso: string;
  endIso: string;
  lines: ReceiptLine[];
  total: number;
};

const num = (value: Money): number => (value == null ? 0 : Number(value));

export const kes = (amount: number): string => `KES ${amount.toLocaleString()}`;

export function isPaidRow(row: ReceiptPaymentRow): boolean {
  const status = row.bookings?.status;
  return status === "confirmed" || status === "completed";
}

export function formatRange(startIso: string, endIso: string): string {
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

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function toReceiptData(
  row: ReceiptPaymentRow,
  payer: { name: string | null; email: string | null },
): ReceiptData | null {
  const booking = row.bookings;
  if (!booking) return null;

  const total = num(booking.total_amount);
  const spectatorAmount = num(booking.spectator_amount);
  const pitchAmount =
    booking.pitch_amount != null ? num(booking.pitch_amount) : total - spectatorAmount;
  const rate = booking.price_snapshot != null ? num(booking.price_snapshot) : null;

  const hours = Math.max(
    1,
    Math.round(
      (new Date(booking.end_time).getTime() -
        new Date(booking.start_time).getTime()) /
        3_600_000,
    ),
  );

  const lines: ReceiptLine[] = [];
  if (booking.pricing_model === "per_person" && booking.players && rate != null) {
    lines.push({
      label: `Pitch, ${booking.players} players x ${kes(rate)}`,
      amount: pitchAmount,
    });
  } else {
    lines.push({
      label: `Pitch booking, ${hours} hour${hours === 1 ? "" : "s"}`,
      amount: pitchAmount,
    });
  }

  if (spectatorAmount > 0 && booking.spectators) {
    const fee =
      booking.spectator_fee_snapshot != null
        ? num(booking.spectator_fee_snapshot)
        : null;
    lines.push({
      label:
        fee != null
          ? `Spectators, ${booking.spectators} x ${kes(fee)}`
          : `Spectators, ${booking.spectators}`,
      amount: spectatorAmount,
    });
  }

  return {
    reference: row.reference,
    paidAt: booking.paid_at,
    payerName: payer.name,
    payerEmail: payer.email,
    venueName: booking.pitches?.venues?.name ?? "Venue",
    pitchName: booking.pitches?.name ?? "Pitch",
    startIso: booking.start_time,
    endIso: booking.end_time,
    lines,
    total,
  };
}