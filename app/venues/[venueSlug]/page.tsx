import { notFound, permanentRedirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/navbar/Navbar";
import VenueDetail, { type BookingAuthState } from "./VenueDetail";
import { getVenue, pickPitchId } from "../data";

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