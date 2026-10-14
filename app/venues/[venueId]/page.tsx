import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/navbar/Navbar";
import VenueDetail, { type BookingAuthState } from "./VenueDetail";
import type { VenueWithRelations } from "../../dashboard/types";

export default async function PublicVenuePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data } = await supabase
    .from("venues")
    .select(
      "id, name, address_text, latitude, longitude, description, rules, venue_images(id, venue_id, storage_path, position), pitches(id, venue_id, name, sport_type, size, price_per_hour, surface_type, status, opens_at, closes_at, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id, amenities(id, name))",
    )
    .eq("id", venueId)
    .maybeSingle();

  const venue = data as unknown as VenueWithRelations | null;

  if (!venue) {
    notFound();
  }

  // A venue with no active pitch is not bookable, so it is not public.
  if (!venue.pitches.some((pitch) => pitch.status === "active")) {
    notFound();
  }

  let bookingAuth: BookingAuthState = { kind: "guest" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "player") {
      bookingAuth = { kind: "player" };
    } else if (profile?.role) {
      const roleLabel = profile.role === "manager" ? "Manager" : String(profile.role);
      bookingAuth = {
        kind: "notice",
        message: (
          <>
            This account is registered as a <strong>{roleLabel}</strong>, so
            create a separate player account to book a pitch.
          </>
        ),
      };
    } else {
      bookingAuth = {
        kind: "notice",
        message: (
          <>
            This account isn&apos;t registered as a player yet. Create a
            separate player account to book a pitch.
          </>
        ),
      };
    }
  }

  return (
    <main>
      <Navbar variant="secondary" />
      <VenueDetail venue={venue} auth={bookingAuth} />
    </main>
  );
}