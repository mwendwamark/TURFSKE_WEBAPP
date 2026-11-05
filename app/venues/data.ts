import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { VenueWithRelations } from "../dashboard/types";
import { slugify } from "@/utils/slug";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const VENUE_SELECT =
  "slug, id, name, address_text, latitude, longitude, description, rules, seating_capacity, spectator_fee, venue_images(id, venue_id, storage_path, position), pitches(id, venue_id, name, sport_type, size, price_per_hour, pricing_model, min_players, max_players, surface_type, status, opens_at, closes_at, pitch_images(id, pitch_id, storage_path, position)), venue_amenities(amenity_id, amenities(id, name))";

export type VenueLookup = { venue: VenueWithRelations; viaId: boolean };

/** One lookup shared by the page and its metadata (cached per request).
 *  Old UUID links are matched by id, everything else by slug. */
export const getVenue = cache(async (param: string): Promise<VenueLookup | null> => {
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

/** ?pitch= can be a pitch id or a pitch name slug. Unknown values are
 * ignored. If multiple active pitches share the same slug, the first one
 * wins. */
export function pickPitchId(
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
