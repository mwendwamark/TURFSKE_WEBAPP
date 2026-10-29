import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ReceiptDocument from "@/components/receipt/ReceiptDocument";
import {
  RECEIPT_SELECT,
  isPaidRow,
  toReceiptData,
  type ReceiptPaymentRow,
} from "@/components/receipt/receipt-data";
import ReceiptToolbar from "./ReceiptToolbar";
import styles from "./receipt.module.css";

export const metadata: Metadata = {
  title: "Receipt | TurfsKE",
  robots: { index: false, follow: false },
};

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Database rules only return payments that belong to this player.
  const { data } = reference
    ? await supabase
        .from("booking_payments")
        .select(RECEIPT_SELECT)
        .eq("reference", reference)
        .maybeSingle()
    : { data: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const row = data as unknown as ReceiptPaymentRow | null;
  const receipt =
    row && isPaidRow(row)
      ? toReceiptData(row, {
          name: profile?.full_name ?? null,
          email: user.email ?? null,
        })
      : null;

  return (
    <main className={styles.page}>
      {receipt ? (
        <>
          <ReceiptToolbar />
          <div className={styles.sheet}>
            <ReceiptDocument data={receipt} />
          </div>
        </>
      ) : (
        <div className={styles.sheet}>
          <p>This receipt isn&apos;t available. It may not be paid yet, or it belongs to another account.</p>
        </div>
      )}
    </main>
  );
}