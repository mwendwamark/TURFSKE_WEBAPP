import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { currentTimeMs } from "@/utils/datetime";
import BookingsClient from "./BookingsClient";
import PlayerBookingsPage from "./PlayerBookingsPage";
import type { ManagerBooking } from "./types";
import styles from "./Bookings.module.css";

async function ManagerBookingsPage() {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.rpc("manager_list_bookings");

  if (error) {
    if ((error.message || "").includes("not_manager")) {
      redirect("/dashboard");
    }

    console.error("manager_list_bookings failed:", error.message);
    return (
      <div className={styles.page}>
        <p className={styles.errorState}>
          We couldn&apos;t load bookings. Please try again.
        </p>
      </div>
    );
  }

  const bookings = (Array.isArray(data) ? data : []) as ManagerBooking[];
  const now = currentTimeMs();

  const upcoming = bookings
    .filter((booking) => new Date(booking.end_time).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  const past = bookings
    .filter((booking) => new Date(booking.end_time).getTime() <= now)
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );

  return <BookingsClient upcoming={upcoming} past={past} />;
}

export default async function BookingsPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "player";

  if (role === "manager") {
    return <ManagerBookingsPage />;
  }

  if (role === "player") {
    return <PlayerBookingsPage />;
  }

  redirect("/dashboard");
}
