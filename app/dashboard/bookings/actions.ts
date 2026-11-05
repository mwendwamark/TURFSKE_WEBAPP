"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { isPastIso } from "@/utils/datetime";
import type {
  CheckBookingCodeResult,
  ManagerBooking,
  RevealPhoneResult,
} from "./types";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function firstBooking(data: unknown): ManagerBooking | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  return row as ManagerBooking;
}

export async function revealPlayerPhoneAction(
  bookingId: string,
): Promise<RevealPhoneResult> {
  if (!bookingId || typeof bookingId !== "string") {
    return { success: false, error: GENERIC_ERROR };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("manager_reveal_player_phone", {
    p_booking_id: bookingId,
  });

  if (error) {
    const message = error.message || "";
    if (message.includes("not_manager")) {
      return { success: false, error: "Only managers can view phone numbers." };
    }
    console.error("manager_reveal_player_phone failed:", message);
    return { success: false, error: GENERIC_ERROR };
  }

  if (typeof data === "string") {
    return { success: true, phone: data };
  }
  if (Array.isArray(data) && typeof data[0] === "string") {
    return { success: true, phone: data[0] };
  }

  return { success: true, phone: null };
}

export async function checkBookingCodeAction(
  code: string,
): Promise<CheckBookingCodeResult> {
  const cleaned = code.trim();
  if (!cleaned) {
    return { status: "not_found" };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("manager_check_booking_code", {
    p_code: cleaned,
  });

  if (error) {
    const message = error.message || "";
    if (message.includes("not_manager")) {
      return {
        status: "error",
        error: "Only managers can check booking codes.",
      };
    }
    console.error("manager_check_booking_code failed:", message);
    return { status: "error", error: GENERIC_ERROR };
  }

  const booking = firstBooking(data);
  if (!booking) {
    return { status: "not_found" };
  }

  return {
    status: "found",
    booking,
    isPast: isPastIso(booking.end_time),
  };
}
