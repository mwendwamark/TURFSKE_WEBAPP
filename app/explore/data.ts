import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Amenity, VenueWithRelations } from "../dashboard/types";

export type ExploreData = {
  venues: VenueWithRelations[];
  amenities: Amenity[];
};

export async function getExploreData(): Promise<ExploreData> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [venuesResult, amenitiesResult] = await Promise.all([
    supabase
      .from("venues")
      .select(
        "slug, id, name, address_text, latitude, longitude, venue_images(id, venue_id, storage_path, position), seating_capacity, spectator_fee, pitches(id, venue_id, name, sport_type, size, price_per_hour, pricing_model, min_players, max_players, surface_type, status, opens_at, closes_at, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id, amenities(id, name))",
      )
      .order("created_at", { ascending: false }),
    supabase.from("amenities").select("id, name").order("name"),
  ]);

  // Only show venues with at least one active pitch — a venue with zero
  // bookable pitches shouldn't appear to players.
  const venues = ((venuesResult.data ?? []) as unknown as VenueWithRelations[])
    .filter((venue) => venue.pitches.some((pitch) => pitch.status === "active"));

  const amenities = (amenitiesResult.data ?? []) as Amenity[];

  return { venues, amenities };
}
