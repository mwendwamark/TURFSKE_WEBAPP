import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import VenueDetail from "./VenueDetail";
import type { Amenity, VenueWithRelations } from "../../types";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;

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

  // Venue detail is a manager-only surface
  if (profile?.role !== "manager") {
    redirect("/dashboard");
  }

  const [venueResult, amenitiesResult] = await Promise.all([
    // Scoped to this manager: a guessed URL for someone else's venue comes
    // back empty and redirects below — never leaking another manager's data.
    supabase
      .from("venues")
      .select(
        "id, name, address_text, latitude, longitude, description, rules, venue_images(id, venue_id, storage_path, position), pitches(id, venue_id, name, sport_type, size, price_per_hour, surface_type, status, opens_at, closes_at, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id, amenities(id, name))",
      )
      .eq("id", venueId)
      .eq("manager_id", user.id)
      .maybeSingle(),
    // Full catalog — VenueForm needs every amenity, not just this venue's.
    supabase.from("amenities").select("id, name").order("name"),
  ]);

  const venue = venueResult.data as VenueWithRelations | null;

  // Missing, deleted, or owned by another manager — all look the same.
  if (!venue) {
    redirect("/dashboard/venues");
  }

  const amenities = (amenitiesResult.data ?? []) as Amenity[];

  return <VenueDetail venue={venue} amenities={amenities} />;
}
