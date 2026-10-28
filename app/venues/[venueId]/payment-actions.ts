"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type StartPaymentResult =
  | { success: true; url: string }
  | { success: false; error: string };

type PaymentRow = {
  reference: string;
  amount_subunits: number;
  commission_subunits: number;
  subaccount_code: string;
  bearer: "account" | "subaccount";
};

const GENERIC_ERROR = "Couldn't start payment. Try again.";

const RPC_ERRORS: [string, string][] = [
  ["hold_expired", "Your hold has expired. Pick the slot again."],
  ["booking_not_payable", "This booking can no longer be paid."],
  ["booking_not_found", "We couldn't find that booking."],
  ["manager_not_payable", "This venue can't take payments yet."],
  ["not_authenticated", "Please log in to pay."],
];

export async function startPaymentAction(
  bookingId: string,
): Promise<StartPaymentResult> {
  if (!bookingId || typeof bookingId !== "string") {
    return { success: false, error: GENERIC_ERROR };
  }

  // Check configuration first, so a missing key never leaves a half-made payment.
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!paystackSecret || !siteUrl) {
    console.error("Payment is not configured: missing PAYSTACK_SECRET_KEY or NEXT_PUBLIC_SITE_URL");
    return { success: false, error: GENERIC_ERROR };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Please log in to pay." };
  }
  if (!user.email) {
    return { success: false, error: "Your account needs an email address to pay." };
  }

  // The database checks the booking belongs to this player, is unpaid and still held,
  // and returns the amounts, so nothing about money comes from the browser.
  const { data, error } = await supabase.rpc("prepare_payment", {
    p_booking_id: bookingId,
  });

  if (error) {
    const message = error.message || "";
    const known = RPC_ERRORS.find(([code]) => message.includes(code));
    if (!known) console.error("prepare_payment failed:", message);
    return { success: false, error: known ? known[1] : GENERIC_ERROR };
  }

  const row = (Array.isArray(data) ? data[0] : data) as PaymentRow | undefined;
  if (!row) {
    return { success: false, error: GENERIC_ERROR };
  }

  const channels = (process.env.PAYSTACK_CHANNELS ?? "mobile_money")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    email: user.email,
    amount: row.amount_subunits,
    currency: "KES",
    reference: row.reference,
    callback_url: `${siteUrl}/payment/complete`,
    channels,
    subaccount: row.subaccount_code,
    bearer: row.bearer,
    ...(row.commission_subunits > 0 && {
      transaction_charge: row.commission_subunits,
    }),
    metadata: { booking_id: bookingId },
  };

  let res: Response;
  try {
    res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (err) {
    console.error("Paystack request failed:", err);
    return { success: false, error: GENERIC_ERROR };
  }

  // Paystack puts the checkout link inside "data".
  const result = await res.json().catch(() => null);
  const url: string | undefined = result?.data?.authorization_url;
  if (!res.ok || !result?.status || !url) {
    console.error("Paystack initialize failed:", res.status, result?.message);
    return { success: false, error: GENERIC_ERROR };
  }

  return { success: true, url };
}