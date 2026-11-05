"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/buttons/Button";
import { updateSettingsAction } from "../actions";
import { normalizeKenyanPhone } from "@/utils/phone";
import styles from "./Settings.module.css";

type SettingsFormProps = {
  initial: {
    fullName: string;
    phoneNumber: string;
    businessName: string;
  };
  isManager: boolean;
  nextPath: string | null;
};

export default function SettingsForm({
  initial,
  isManager,
  nextPath,
}: SettingsFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initial.fullName);
  const [phoneNumber, setPhoneNumber] = useState(initial.phoneNumber);
  const [businessName, setBusinessName] = useState(initial.businessName);

  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const normalizedPhone = normalizeKenyanPhone(phoneNumber);
    if (!normalizedPhone) {
      setMessage({
        type: "error",
        text: "Enter a valid Kenyan phone number, e.g. 0712 345 678.",
      });
      return;
    }

    startTransition(async () => {
      const result = await updateSettingsAction({
        fullName,
        phoneNumber: normalizedPhone,
        businessName: isManager ? businessName : "",
      });

      if (result.success === false) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      if (nextPath) {
        router.push(nextPath);
        return;
      }

      setMessage({ type: "success", text: "Your settings were saved." });
      router.refresh();
    });
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Settings</h2>
      <p className={styles.sub}>Update your personal details.</p>

      {nextPath && (
        <p className={styles.info}>
          Add your phone number to continue your booking.
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {isManager && (
          <div className={styles.field}>
            <label htmlFor="settings-business">Business name</label>
            <input
              id="settings-business"
              name="business_name"
              type="text"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="e.g. Kasarani Sports Grounds"
              required
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="settings-name">Full name</label>
          <input
            id="settings-name"
            name="full_name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="settings-phone">Phone number</label>
          <input
            id="settings-phone"
            name="phone_number"
            type="tel"
            inputMode="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="e.g. 0712 345 678"
            required
          />
          <p className={styles.hint}>Used for payout notifications and booking updates.</p>
        </div>

        {message && (
          <p
            className={`${styles.message} ${
              message.type === "success" ? styles.message_success : styles.message_error
            }`}
            role={message.type === "success" ? "status" : "alert"}
          >
            {message.text}
          </p>
        )}

        <div>
          <Button type="submit" variant="black" arrow={false} disabled={isPending}>
            {isPending ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}