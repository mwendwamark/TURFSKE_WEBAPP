export type ManagerBooking = {
  booking_id: string;
  booking_code: string;
  venue_name: string;
  pitch_name: string;
  start_time: string;
  end_time: string;
  status: string;
  players: number | null;
  spectators: number | null;
  total_amount: number | string;
  manager_amount: number | string;
  paid_at: string | null;
  player_name: string | null;
  player_phone_masked: string | null;
  has_phone: boolean;
};

export type RevealPhoneResult =
  | { success: true; phone: string | null }
  | { success: false; error: string };

export type CheckBookingCodeResult =
  | { status: "found"; booking: ManagerBooking; isPast: boolean }
  | { status: "not_found" }
  | { status: "error"; error: string };
