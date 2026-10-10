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

  const { data: venue } = await supabase
    .from("venues")
    .select(
      "id, name, address_text, latitude, longitude, description, rules, venue_images(id, venue_id, storage_path, position), pitches(id, venue_id, name, sport_type, size, price_per_hour, surface_type, status, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id, amenities(id, name))",
    )
    .eq("id", venueId)
    .maybeSingle();

  if (!venue) {
    notFound();
  }

  // Only show venues with at least one active pitch
  const hasActivePitches = venue.pitches.some(
    (pitch) => pitch.status === "active",
  );
  if (!hasActivePitches) {
    notFound();
  }

  // Decide what the Book now / Select buttons should do for the
  // current visitor. The venue page is public, so this must work
  // for every auth state:
  // - logged out    → signup link carrying ?next=<venue path>
  // - player        → booking isn't built yet (Phase 4), so an
  //                   inline disabled "coming soon" state
  // - manager/other → inline role notice; never a redirect
  //                   (the proxy silently bounces signed-in users
  //                   from /auth/signup to /dashboard)
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
    } else if (profile?.role === "manager") {
      bookingAuth = {
        kind: "notice",
        message: (
          <>
            This account is registered as a <strong>Manager</strong> —
            create a separate player account to book a pitch.
          </>
        ),
      };
    } else if (profile?.role) {
      const roleLabel = String(profile.role);
      bookingAuth = {
        kind: "notice",
        message: (
          <>
            This account is registered as a <strong>{roleLabel}</strong> —
            create a separate player account to book a pitch.
          </>
        ),
      };
    } else {
      // Signed in but no profile row yet (e.g. still mid role
      // selection). Booking needs a player account.
      bookingAuth = {
        kind: "notice",
        message: (
          <>
            This account isn&apos;t registered as a player yet — create a
            separate player account to book a pitch.
          </>
        ),
      };
    }
  }

  return (
    <main>
      <Navbar variant="secondary" />
      <VenueDetail
        venue={venue as unknown as VenueWithRelations}
        auth={bookingAuth}
      />
    </main>
  );
}
