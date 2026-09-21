import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Button from "@/components/ui/buttons/Button";
import RoleNoticeBanner from "@/components/auth/RoleNoticeBanner";
import ManagerOverview from "./ManagerOverview";
import type { Amenity, PayoutStatus, VenueWithRelations } from "./types";
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
    const [venueResult, amenitiesResult, managerProfileResult] = await Promise.all([
      supabase
        .from("venues")
        .select(
          "id, name, address_text, latitude, longitude, venue_images(id, venue_id, storage_path, position), pitches(id, venue_id, name, sport_type, size, price_per_hour, surface_type, status, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id)",
        )
        .eq("manager_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("amenities").select("id, name").order("name"),
      supabase
        .from("manager_profiles")
        .select("business_name, paystack_subaccount_code, verified")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const venues = (venueResult.data ?? []) as VenueWithRelations[];
    const amenities = (amenitiesResult.data ?? []) as Amenity[];
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
          <div className={styles.stat_card}>
            <span className={styles.stat_value}>{managersRes.count ?? 0}</span>
            <span className={styles.stat_label}>Turf managers</span>
          </div>
          <div className={styles.stat_card}>
            <span className={styles.stat_value}>{playersRes.count ?? 0}</span>
            <span className={styles.stat_label}>Players</span>
          </div>
          <div className={styles.stat_card}>
            <span className={styles.stat_value}>{venuesRes.count ?? 0}</span>
            <span className={styles.stat_label}>Venues listed</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Player overview ──
  return (
    <div className={styles.overview}>
      {roleNotice && <RoleNoticeBanner notice={roleNotice} />}

      <div className={styles.welcome_card}>
        <h2 className={styles.welcome_title}>Welcome, {fullName}</h2>
        <p className={styles.welcome_text}>
          Find football pitches near you and book them in minutes. Booking is
          coming soon — for now, browse the pitches available on TurfsKE.
        </p>
        <div>
          <Button href="/explore">Browse pitches</Button>
        </div>
      </div>
    </div>
  );
}