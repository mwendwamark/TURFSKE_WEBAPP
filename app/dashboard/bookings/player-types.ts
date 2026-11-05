export type PlayerBooking = {
  booking_id: string;
  booking_code: string;
  paid_reference: string;
  venue_name: string;
  venue_slug: string;
  pitch_name: string;
  start_time: string;
  end_time: string;
  status: string;
  players: number | null;
  spectators: number | null;
  total_amount: number | string;
  paid_at: string | null;
  refund_required: boolean;
  manager_name: string | null;
  manager_phone: string | null;
};
