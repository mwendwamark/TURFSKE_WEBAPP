import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/navbar/Navbar";
import VenueDetail, { type BookingAuthState } from "./VenueDetail";
import type { VenueWithRelations } from "../../dashboard/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VENUE_SELECT =
  "slug, id, name, address_text, latitude, longitude, description, rules, seating_capacity, spectator_fee, venue_images(id, venue_id, storage_path, position), pitches(id, venue_id, name, sport_type, size, price_per_hour, pricing_model, min_players, max_players, surface_type, status, opens_at, closes_at, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id, amenities(id, name))";

type VenueLookup = { venue: VenueWithRelations; viaId: boolean };

/** One lookup shared by the page and its metadata (cached per request).
 *  Old UUID links are matched by id, everything else by slug. */
const getVenue = cache(async (param: string): Promise<VenueLookup | null> => {
  const supabase = createClient(await cookies());
  const viaId = UUID_RE.test(param);

  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_SELECT)
    .eq(viaId ? "id" : "slug", param)
    .maybeSingle();

  if (error) {
    console.error("Venue lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  return { venue: data as unknown as VenueWithRelations, viaId };
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** ?pitch= can be a pitch id or a pitch name slug. Unknown values are
 * ignored. If multiple active pitches share the same slug, the first one
 * wins. */
function pickPitchId(
  pitches: VenueWithRelations["pitches"],
  raw: string | string[] | undefined,
): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;

  const active = pitches.filter((pitch) => pitch.status === "active");
  const byId = active.find((pitch) => pitch.id === value);
  if (byId) return byId.id;

  const wanted = slugify(value);
  if (!wanted) return undefined;

  return active.find((pitch) => slugify(pitch.name) === wanted)?.id;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}): Promise<Metadata> {
  const { venueSlug } = await params;
  const result = await getVenue(venueSlug);
  if (!result) return { title: "Venue not found | TurfsKE" };

  const { venue } = result;
  const cover = [...(venue.venue_images ?? [])].sort(
    (a, b) => a.position - b.position,
  )[0];
  const image = cover
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venue-media/${cover.storage_path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`
    : undefined;
  const description =
    venue.description?.slice(0, 160) ||
    `Book a football pitch at ${venue.name}${venue.address_text ? `, ${venue.address_text}` : ""} on TurfsKE.`;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  return {
    title: `${venue.name} | TurfsKE`,
    description,
    ...(site ? { alternates: { canonical: `${site}/venues/${venue.slug}` } } : {}),
    openGraph: {
      title: venue.name,
      description,
      type: "website",
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: venue.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PublicVenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { venueSlug } = await params;
  const query = await searchParams;

  const result = await getVenue(venueSlug);
  if (!result) notFound();

  const { venue, viaId } = result;

  // Old links that used the venue id move permanently to the slug address,
  // keeping any query string such as ?pitch=.
  if (viaId) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
      else if (value !== undefined) qs.append(key, value);
    }
    const suffix = qs.toString();
    permanentRedirect(`/venues/${venue.slug}${suffix ? `?${suffix}` : ""}`);
  }

  // A venue with no active pitch is not bookable, so it is not public.
  if (!venue.pitches.some((pitch) => pitch.status === "active")) {
    notFound();
  }

  const preselectedPitchId = pickPitchId(venue.pitches, query.pitch);

  let bookingAuth: BookingAuthState = { kind: "guest" };

  const supabase = createClient(await cookies());
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
      const roleLabel =
        profile.role === "manager" ? "Manager" : String(profile.role);
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
      <VenueDetail
        venue={venue}
        auth={bookingAuth}
        preselectedPitchId={preselectedPitchId}
      />
    </main>
  );
}