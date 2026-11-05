import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { currentTimeMs, isPastIso } from "@/utils/datetime";
import PlayerBookingsClient from "./PlayerBookingsClient";
import type { PlayerBooking } from "./player-types";
import styles from "./PlayerBookings.module.css";

export default async function PlayerBookingsPage() {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("player_list_bookings");

  if (error) {
    if ((error.message || "").includes("not_player")) {
      redirect("/dashboard");
    }

    console.error("player_list_bookings failed:", error.message);
    return (
      <div className={styles.page}>
        <p className={styles.errorState}>
          We couldn&apos;t load your bookings. Please try again.
        </p>
      </div>
    );
  }

  const bookings = (Array.isArray(data) ? data : []) as PlayerBooking[];
  const now = currentTimeMs();

  const upcoming = bookings
    .filter((booking) => !isPastIso(booking.end_time, now))
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  const past = bookings
    .filter((booking) => isPastIso(booking.end_time, now))
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );

  return <PlayerBookingsClient upcoming={upcoming} past={past} />;
}
