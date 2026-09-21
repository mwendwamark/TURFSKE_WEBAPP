import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ManagerDashboard from "../ManagerDashboard";
import type { Amenity, PayoutStatus, VenueWithRelations } from "../types";

export default async function VenuesPage() {
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // My Venues is a manager-only surface
  if (profile?.role !== "manager") {
    redirect("/dashboard");
  }

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
    <ManagerDashboard venues={venues} amenities={amenities} payout={payout} />
  );
}