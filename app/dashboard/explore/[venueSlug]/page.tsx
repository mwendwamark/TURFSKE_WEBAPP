import { cookies } from "next/headers";
import {
  notFound,
  permanentRedirect,
  redirect,
} from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import VenueDetail from "../../../venues/[venueSlug]/VenueDetail";
import { getVenue, pickPitchId } from "../../../venues/data";
import styles from "./VenueDetailDashboard.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardVenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { venueSlug } = await params;
  const query = await searchParams;

  const supabase = createClient(await cookies());
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

  if (profile?.role !== "player") {
    redirect("/dashboard");
  }

  const result = await getVenue(venueSlug);
  if (!result) notFound();

  const { venue, viaId } = result;

  // Old id links keep their query string when moved to the slug address.
  if (viaId) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
      else if (value !== undefined) qs.append(key, value);
    }
    const suffix = qs.toString();
    permanentRedirect(
      `/dashboard/explore/${venue.slug}${suffix ? `?${suffix}` : ""}`,
    );
  }

  if (!venue.pitches.some((pitch) => pitch.status === "active")) {
    notFound();
  }

  const preselectedPitchId = pickPitchId(venue.pitches, query.pitch);

  return (
    <div className={styles.embed}>
      <VenueDetail
        venue={venue}
        auth={{ kind: "player" }}
        preselectedPitchId={preselectedPitchId}
        backHref="/dashboard/explore"
        backLabel="Back to venues"
      />
    </div>
  );
}
