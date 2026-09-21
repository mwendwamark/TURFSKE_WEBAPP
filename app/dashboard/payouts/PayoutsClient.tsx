"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/buttons/Button";
import { getPaystackBanks, setPayoutAccountAction } from "../actions";
import type { BankOption, PayoutStatus } from "../types";
import styles from "../ManagerDashboard.module.css";

type PayoutsClientProps = {
  payout: PayoutStatus;
};

export default function PayoutsClient({ payout }: PayoutsClientProps) {
  const router = useRouter();
  const configured = payout.paystackSubaccountCode != null;

  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankError, setBankError] = useState<string | null>(null);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (configured) return;
    let active = true;

    async function loadBanks() {
      const result = await getPaystackBanks();
      if (!active) return;

      if (result.success === false) {
        setBankError(result.error);
        return;
      }
      setBanks(result.banks);
    }

    loadBanks();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!bankCode) {
      setMessage({ type: "error", text: "Please choose your bank." });
      return;
    }

    const digitsOnly = accountNumber.replace(/\D/g, "");
    if (digitsOnly.length < 6) {
      setMessage({ type: "error", text: "That account number looks too short to be real." });
      return;
    }

    const selectedBank = banks.find((bank) => bank.code === bankCode);
    if (!selectedBank) {
      setMessage({ type: "error", text: "Please choose your bank." });
      return;
    }

    startTransition(async () => {
      const result = await setPayoutAccountAction({
        bankCode: selectedBank.code,
        accountNumber: digitsOnly,
      });

      if (result.success === false) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      router.refresh();
    });
  }

  if (configured) {
    return (
      <div className={styles.payout_status_card}>
        <p className={styles.payout_status_title}>Payouts are set up</p>
        {payout.businessName && (
          <p className={styles.payout_status_row}>
            <span className={styles.payout_status_label}>Business</span>
            {payout.businessName}
          </p>
        )}
        <p className={styles.payout_status_row}>
          <span className={styles.payout_status_label}>Status</span>
          {payout.verified === false ? "Awaiting verification" : "Active"}
        </p>
        <p className={styles.payout_status_note}>
          Money from player bookings will be paid into this account. To change your
          payout details, please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.payout_setup_card}>
      <h2 className={styles.payout_setup_title}>Set up payouts</h2>
      <p className={styles.payout_setup_text}>
        Add a M-Pesa or bank account so money from player bookings is paid into it. This only takes
        a minute.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        {bankError ? (
          <p className={`${styles.form_message} ${styles.form_message_error}`} role="alert">
            {bankError}
          </p>
        ) : banks.length === 0 ? (
          <p className={styles.bank_loading}>Loading banks…</p>
        ) : (
          <>
            <div className={styles.field}>
              <label htmlFor="payout-bank">Bank or mobile money</label>
              <select
                id="payout-bank"
                name="bank"
                value={bankCode}
                onChange={(event) => setBankCode(event.target.value)}
              >
                <option value="">Select…</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="payout-account">Account number</label>
              <input
                id="payout-account"
                name="account_number"
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value.replace(/[^\d]/g, ""))}
                placeholder="Digits only"
                required
              />
            </div>
          </>
        )}

        {message && (
          <p className={`${styles.form_message} ${styles.form_message_error}`} role="alert">
            {message.text}
          </p>
        )}

        <div className={styles.form_actions}>
          <Button
            type="submit"
            variant="black"
            arrow={false}
            disabled={isPending || banks.length === 0 || Boolean(bankError)}
          >
            {isPending ? "Saving..." : "Save payment details"}
          </Button>
        </div>
      </form>
    </div>
  );
}