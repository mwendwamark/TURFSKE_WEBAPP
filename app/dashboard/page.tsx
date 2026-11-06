import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Ticket,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import Button from "@/components/ui/buttons/Button";
import RoleNoticeBanner from "@/components/auth/RoleNoticeBanner";
import ManagerOverview from "./ManagerOverview";
import StatCard from "./StatCard";
import type { Amenity, PayoutStatus, VenueWithRelations } from "./types";
import type { ManagerBooking } from "./bookings/types";
import type { PlayerBooking } from "./bookings/player-types";
import {
  currentTimeMs,
  formatNairobiRange,
  nairobiDayKey,
  nairobiMonthKey,
} from "@/utils/datetime";
import { formatKes } from "@/utils/money";
import styles from "./Overview.module.css";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "player";
  const fullName = profile?.full_name || user.email || "Player";

  const { role_notice } = await searchParams;
  const roleNotice = typeof role_notice === "string" ? role_notice : undefined;

  // ── Manager overview ──
  if (role === "manager") {
    const overviewNow = currentTimeMs();
    const overviewNowIso = new Date(overviewNow).toISOString();
    const managerBookingsPromise = (async () => {
      try {
        return await supabase.rpc("manager_list_bookings");
      } catch (error: unknown) {
        console.error("manager_list_bookings failed:", error);
        return null;
      }
    })();
    const [
      venueResult,
      amenitiesResult,
      managerProfileResult,
      managerBookingsResult,
    ] = await Promise.all([
      supabase
        .from("venues")
        .select(
          "id, name, address_text, latitude, longitude, description, rules, venue_images(id, venue_id, storage_path, position), seating_capacity, spectator_fee, pitches(id, venue_id, name, sport_type, size, price_per_hour, pricing_model, min_players, max_players, surface_type, status, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id)",
        )
        .eq("manager_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("amenities").select("id, name").order("name"),
      supabase
        .from("manager_profiles")
        .select("business_name, paystack_subaccount_code, verified")
        .eq("user_id", user.id)
        .maybeSingle(),
      managerBookingsPromise,
    ]);

    if (managerBookingsResult?.error) {
      console.error("manager_list_bookings failed:", managerBookingsResult.error);
    }

    const venues = (venueResult.data ?? []) as VenueWithRelations[];
    const amenities = (amenitiesResult.data ?? []) as Amenity[];
    const managerBookings = Array.isArray(managerBookingsResult?.data)
      ? (managerBookingsResult.data as ManagerBooking[])
      : [];
    const payout: PayoutStatus = {
      businessName: managerProfileResult.data?.business_name ?? null,
      paystackSubaccountCode: managerProfileResult.data?.paystack_subaccount_code ?? null,
      verified: managerProfileResult.data?.verified ?? null,
    };

    return (
      <ManagerOverview
        venues={venues}
        amenities={amenities}
        payout={payout}
        fullName={fullName}
        roleNotice={roleNotice}
        bookings={managerBookingsResult?.error ? [] : managerBookings}
        bookingError={!managerBookingsResult || Boolean(managerBookingsResult.error)}
        nowMs={overviewNow}
        todayKey={nairobiDayKey(overviewNowIso)}
        thisMonthKey={nairobiMonthKey(overviewNowIso)}
      />
    );
  }

  // ── Admin overview ──
  if (role === "admin") {
    const [managersRes, playersRes, venuesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "manager"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "player"),
      supabase.from("venues").select("id", { count: "exact", head: true }),
    ]);

    return (
      <div className={styles.overview}>
        <div className={styles.page_head}>
          <div>
            <h2 className={styles.page_title}>Welcome, {fullName}</h2>
            <p className={styles.page_sub}>Platform overview at a glance.</p>
          </div>
        </div>

        <div className={styles.stat_grid}>
          <StatCard
            icon={Users}
            label="Turf managers"
            value={managersRes.count ?? 0}
            featured
          />
          <StatCard
            icon={User}
            label="Players"
            value={playersRes.count ?? 0}
          />
          <StatCard
            icon={Building2}
            label="Venues listed"
            value={venuesRes.count ?? 0}
          />
        </div>
      </div>
    );
  }

  // ── Player overview ──
  let playerBookingsData: PlayerBooking[] = [];
  let playerBookingsError = false;

  try {
    const { data, error } = await supabase.rpc("player_list_bookings");
    if (error) {
      console.error("player_list_bookings failed:", error);
      playerBookingsError = true;
    } else if (Array.isArray(data)) {
      playerBookingsData = data as PlayerBooking[];
    }
  } catch (error: unknown) {
    console.error("player_list_bookings failed:", error);
    playerBookingsError = true;
  }

  const playerBookings = playerBookingsData;
  const paidBookings = playerBookings.filter(
    (booking) => !booking.refund_required,
  );
  const now = currentTimeMs();
  const upcomingBookings = paidBookings
    .filter((booking) => new Date(booking.end_time).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  const nextGame = upcomingBookings[0];
  const recentBookings = [...paidBookings]
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    )
    .slice(0, 3);

  return (
    <div className={styles.overview}>
      {roleNotice && <RoleNoticeBanner notice={roleNotice} />}

      <div className={styles.welcome_card}>
        <h2 className={styles.welcome_title}>Welcome, {fullName}</h2>
        <p className={styles.welcome_text}>
          Find a pitch, book it, and keep your codes and receipts in one place.
        </p>
        <div className={styles.welcome_actions}>
          <Button href="/dashboard/bookings">View my bookings</Button>
          <Button href="/dashboard/explore" variant="outline">
            Browse pitches
          </Button>
        </div>
      </div>

      {playerBookingsError && (
        <p className={styles.error_notice} role="status">
          We couldn&apos;t load your booking summary. Please try again.
        </p>
      )}

      <div className={styles.stat_grid}>
        <StatCard
          icon={CalendarClock}
          label="Upcoming"
          value={upcomingBookings.length}
          featured
        />
        <StatCard
          icon={Ticket}
          label="Games booked"
          value={paidBookings.length}
        />
        <StatCard
          icon={Wallet}
          label="Total spent"
          value={formatKes(
            paidBookings.reduce(
              (sum, booking) => sum + Number(booking.total_amount || 0),
              0,
            ),
          )}
        />
      </div>

      <section className={styles.feature_section}>
        <div className={styles.section_head}>
          <h3 className={styles.section_title}>Next game</h3>
        </div>
        {nextGame ? (
          <div className={styles.feature_card}>
            <div className={styles.booking_info}>
              <p className={styles.booking_title}>{nextGame.venue_name}</p>
              <p className={styles.booking_detail}>{nextGame.pitch_name}</p>
              <p className={styles.booking_detail}>
                {formatNairobiRange(nextGame.start_time, nextGame.end_time)}
              </p>
              <p className={styles.booking_code}>{nextGame.booking_code}</p>
            </div>
            <div className={styles.booking_actions}>
              {nextGame.manager_phone && (
                <Button
                  href={`tel:${nextGame.manager_phone}`}
                  variant="outline"
                  arrow={false}
                >
                  Call venue
                </Button>
              )}
              {nextGame.paid_reference && (
                <Button
                  href={`/payment/receipt?reference=${encodeURIComponent(nextGame.paid_reference)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  arrow={false}
                >
                  View receipt
                </Button>
              )}
              <Button
                href={`/dashboard/explore/${nextGame.venue_slug}`}
                variant="primary"
                arrow={false}
              >
                Open venue
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.feature_card}>
            <p className={styles.empty_list}>No upcoming games yet.</p>
            <Button href="/dashboard/explore" variant="primary" arrow={false}>
              Find a pitch
            </Button>
          </div>
        )}
      </section>

      <section className={styles.recent_block}>
        <div className={styles.section_head}>
          <h3 className={styles.section_title}>Recent bookings</h3>
          <Button href="/dashboard/bookings" variant="outline" arrow={false}>
            View all
          </Button>
        </div>
        <div className={styles.recent_list}>
          {recentBookings.length === 0 ? (
            <p className={styles.empty_list}>No bookings yet.</p>
          ) : (
            recentBookings.map((booking) => (
              <div key={booking.booking_id} className={styles.booking_row}>
                <div className={styles.booking_info}>
                  <p className={styles.booking_title}>{booking.venue_name}</p>
                  <p className={styles.booking_detail}>
                    {booking.pitch_name} ·{" "}
                    {formatNairobiRange(booking.start_time, booking.end_time)}
                  </p>
                </div>
                <span className={styles.booking_amount}>
                  {formatKes(booking.total_amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}