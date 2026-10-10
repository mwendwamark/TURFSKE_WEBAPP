import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/navbar/Navbar";
import Explore from "./Explore";
import type { Amenity, VenueWithRelations } from "../dashboard/types";

export const metadata: Metadata = {
  title: "Browse Football Turfs in Kenya",
  description:
    "Browse and compare football turfs across Kenya. Filter by location, pitch size, surface type, and price. Find available slots near you on TurfsKE.",
  openGraph: {
    title: "Browse Football Turfs in Kenya | TurfsKE",
    description:
      "Browse and compare football turfs across Kenya. Filter by location, pitch size, surface type, and price.",
  },
};

export default async function ExplorePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [venuesResult, amenitiesResult] = await Promise.all([
    supabase
      .from("venues")
      .select(
        "id, name, address_text, latitude, longitude, venue_images(id, venue_id, storage_path, position), pitches(id, venue_id, name, sport_type, size, price_per_hour, surface_type, status, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id, amenities(id, name))",
      )
      .order("created_at", { ascending: false }),
    supabase.from("amenities").select("id, name").order("name"),
  ]);

  // Only show venues with at least one active pitch — a venue with zero
  // bookable pitches shouldn't appear to players.
  const venues = ((venuesResult.data ?? []) as unknown as VenueWithRelations[])
    .filter((venue) => venue.pitches.some((pitch) => pitch.status === "active"));

  const amenities = (amenitiesResult.data ?? []) as Amenity[];

  return (
    <main>
      <Navbar variant="secondary" />
      <Explore venues={venues} amenities={amenities} />
    </main>
  );
}
