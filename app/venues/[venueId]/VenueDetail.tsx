"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import BookingPanel from "./BookingPanel";
import {
  Wifi,
  ArrowLeft,
  Armchair,
  CircleParking,
  Droplet,
  Lightbulb,
  MapPin,
  Shirt,
  Sparkles,
  Toilet,
  User,
  UserCheck,
  Utensils,
  Volleyball,
  BriefcaseMedical,
  type LucideIcon,
} from "lucide-react";
import ImageGallery from "../../dashboard/ImageGallery";
import StorageImage from "../../dashboard/StorageImage";
import Button from "../../../components/ui/buttons/Button";
import RoleNoticeBanner from "../../../components/auth/RoleNoticeBanner";
import type { VenueWithRelations } from "../../dashboard/types";
import {
  pitchPlayersLabel,
  pitchPriceLabel,
  pitchStartingPrice,
} from "@/utils/pricing";
import styles from "./VenueDetail.module.css";

/**
 * What the Book now / Select buttons do, decided server side on the
 * venue page:
 *
 * guest:  link to /auth/signup carrying ?next=<venue path>
 * player: opens the booking panel (hold a slot, then pay with M-Pesa).
 *         Never a link, because the proxy silently bounces signed in
 *         users away from /auth/signup to /dashboard.
 * notice: the account's role means it can't book (manager, admin, ...).
 *         Shows the RoleNoticeBanner with an inline message, no redirect.
 */
export type BookingAuthState =
  | { kind: "guest" }
  | { kind: "player" }
  | { kind: "notice"; message: ReactNode };

/**
 * Amenity name to icon. Keys are lowercase; matching is normalized, so
 * "Parking", "parking" and " Parking " all hit the same entry.
 */
const AMENITY_ICONS: Record<string, LucideIcon> = {
  parking: CircleParking,
  "car park": CircleParking,
  "parking lot": CircleParking,
  floodlights: Lightbulb,
  "changing rooms": Shirt,
  "changing room": Shirt,
  seating: Armchair,
  benches: Armchair,
  "water point": Droplet,
  water: Droplet,
  washrooms: Toilet,
  restroom: Toilet,
  restrooms: Toilet,
  toilet: Toilet,
  toilets: Toilet,
  bibs: UserCheck,
  canteen: Utensils,
  wifi: Wifi,
  "balls provided": Volleyball,
  "referee available": User,
  "spectator seating": Armchair,
  "first aid": BriefcaseMedical,
};

const AMENITY_FALLBACK_ICON: LucideIcon = Sparkles;

function amenityIcon(name: string): LucideIcon {
  return AMENITY_ICONS[name.trim().toLowerCase()] ?? AMENITY_FALLBACK_ICON;
}

function pitchCover(pitch: VenueWithRelations["pitches"][number]) {
  return (
    [...(pitch.pitch_images ?? [])].sort(
      (a, b) => a.position - b.position,
    )[0] ?? null
  );
}

function formatPrice(price: number): string {
  return `KES ${price.toLocaleString()}`;
}

type VenueDetailProps = {
  venue: VenueWithRelations;
  auth: BookingAuthState;
};

export default function VenueDetail({ venue, auth }: VenueDetailProps) {
  const activePitches = venue.pitches.filter((p) => p.status === "active");
  const [openPitchId, setOpenPitchId] = useState<string | null>(null);
  const openPitch = activePitches.find((p) => p.id === openPitchId);
  const amenityNames = venue.venue_amenities
    .map((link) => link.amenities?.name)
    .filter((name): name is string => Boolean(name));

  // What the cheapest booking costs: group minimum for per person pitches.
  const startingPrices = activePitches
    .map((p) => pitchStartingPrice(p))
    .filter((price): price is number => price != null);
  const fromPrice =
    startingPrices.length > 0 ? Math.min(...startingPrices) : null;

  const seatingLine =
    venue.seating_capacity != null
      ? `Spectator seating: up to ${venue.seating_capacity} seats${
          venue.spectator_fee != null && venue.spectator_fee > 0
            ? `, ${formatPrice(venue.spectator_fee)} per spectator`
            : ", free"
        }`
      : null;

  // Signed in users are never sent to /auth/signup, the proxy bounces
  // them to /dashboard, which would silently swallow the booking action.
  // Guests get the signup link with a ?next return path instead.
  const bookingHref = `/auth/signup?next=${encodeURIComponent(
    `/venues/${venue.id}`,
  )}`;
  const isGuest = auth.kind === "guest";
  const isPlayer = auth.kind === "player";

  function bookNowButton(className?: string) {
    if (isGuest) {
      return (
        <Button
          variant="primary"
          href={bookingHref}
          className={className}
          fullWidth={Boolean(className)}
        >
          Book now
        </Button>
      );
    }
    if (isPlayer) {
      return (
        <Button
          variant="primary"
          className={className}
          fullWidth={Boolean(className)}
          onClick={() =>
            document
              .getElementById("pitches")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Book now
        </Button>
      );
    }
    return (
      <Button
        variant="primary"
        className={className}
        fullWidth={Boolean(className)}
        disabled
      >
        Book now
      </Button>
    );
  }

  function selectButton(pitchId: string) {
    if (isGuest) {
      return (
        <Button variant="outline" href={bookingHref}>
          Select
        </Button>
      );
    }
    if (isPlayer) {
      return (
        <Button
          variant="outline"
          onClick={() =>
            setOpenPitchId(openPitchId === pitchId ? null : pitchId)
          }
        >
          {openPitchId === pitchId ? "Close" : "Select"}
        </Button>
      );
    }
    return (
      <Button variant="outline" disabled>
        Select
      </Button>
    );
  }

  const ctaNote = isGuest
    ? "Create an account to book"
    : auth.kind === "player"
      ? "Pick a pitch and a time"
      : "Create a separate player account to book";

  return (
    <div className={` section ${styles.detail}`}>
      <Link href="/explore" className={styles.back_link}>
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      {auth.kind === "notice" && <RoleNoticeBanner message={auth.message} />}

      <div className={`${styles.layout}`}>
        <div className={styles.main_col}>
          <ImageGallery
            images={venue.venue_images}
            alt={venue.name}
            variant="detail"
            overlayControls
            sizes="(max-width: 999px) 92vw, 780px"
          />

          <div className={styles.head}>
            <h2 className={styles.title}>{venue.name}</h2>
            {venue.address_text && (
              <p className={styles.address}>{venue.address_text}</p>
            )}
            {venue.latitude != null && venue.longitude != null && (
              <p className={styles.coords}>
                <MapPin size={14} aria-hidden="true" />
                {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
              </p>
            )}
          </div>

          {amenityNames.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.section_title}>Amenities</h3>
              <div className={styles.chips}>
                {amenityNames.map((name) => {
                  const Icon = amenityIcon(name);
                  return (
                    <span key={name} className={styles.chip}>
                      <Icon size={15} aria-hidden="true" />
                      {name}
                    </span>
                  );
                })}
              </div>
              {seatingLine && (
                <p className={styles.description_text}>{seatingLine}</p>
              )}
            </section>
          )}

          {venue.description && (
            <section className={styles.section}>
              <h3 className={styles.section_title}>About this turf</h3>
              <p className={styles.description_text}>{venue.description}</p>
            </section>
          )}

          {venue.rules && (
            <section className={styles.section}>
              <h3 className={styles.section_title}>House rules</h3>
              <p className={styles.description_text}>{venue.rules}</p>
            </section>
          )}

          <section className={styles.section} id="pitches">
            <h3 className={styles.section_title}>
              Pitches{" "}
              <span className={styles.section_count}>
                {activePitches.length === 0
                  ? "None available"
                  : activePitches.length === 1
                    ? "1 pitch"
                    : `${activePitches.length} pitches`}
              </span>
            </h3>

            {activePitches.length === 0 ? (
              <p className={styles.section_empty}>
                No active pitches at this venue yet.
              </p>
            ) : (
              <ul className={styles.pitch_list}>
                {activePitches.map((pitch) => {
                  const cover = pitchCover(pitch);
                  const playersLabel = pitchPlayersLabel(pitch);
                  return (
                    <li key={pitch.id} className={styles.pitch_card}>
                      <div className={styles.pitch_thumb}>
                        {cover ? (
                          <StorageImage
                            storagePath={cover.storage_path}
                            alt={pitch.name}
                            sizes="(max-width: 640px) 80vw, 120px"
                            className={styles.pitch_thumb_image}
                          />
                        ) : (
                          <div className={styles.pitch_thumb_empty}>
                            <MapPin size={18} aria-hidden="true" />
                          </div>
                        )}
                      </div>

                      <div className={styles.pitch_body}>
                        <div className={styles.pitch_head}>
                          <p className={styles.pitch_name}>{pitch.name}</p>
                          {pitch.price_per_hour != null && (
                            <p className={styles.pitch_price}>
                              {pitchPriceLabel(pitch)}
                            </p>
                          )}
                        </div>
                        <div className={styles.pitch_badges}>
                          {pitch.size && (
                            <span className={styles.badge}>{pitch.size}</span>
                          )}
                          {pitch.surface_type && (
                            <span className={styles.badge}>
                              {pitch.surface_type}
                            </span>
                          )}
                          {playersLabel && (
                            <span className={styles.badge}>{playersLabel}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.pitch_actions}>
                        {selectButton(pitch.id)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {isPlayer && openPitch && (
              <BookingPanel
                key={openPitch.id}
                pitch={openPitch}
                onClose={() => setOpenPitchId(null)}
                seatingCapacity={venue.seating_capacity ?? null}
                spectatorFee={venue.spectator_fee ?? null}
              />
            )}
          </section>
        </div>

        <aside className={styles.summary}>
          {fromPrice != null && (
            <div className={styles.summary_priceRow}>
              <span className={styles.summary_from}>From</span>
              <span className={styles.summary_price}>
                {formatPrice(fromPrice)}
                <span className={styles.summary_price_period}>/hr</span>
              </span>
            </div>
          )}
          <p className={styles.summary_venue}>{venue.name}</p>
          {bookNowButton(styles.summary_cta)}
          <p className={styles.summary_note}>{ctaNote}</p>
        </aside>
      </div>

      {fromPrice != null && (
        <div className={styles.bottom_bar}>
          <div className={styles.bottom_bar_info}>
            <span className={styles.bottom_bar_from}>From</span>
            <span className={styles.bottom_bar_price}>
              {formatPrice(fromPrice)}
              <span className={styles.bottom_bar_period}>/hr</span>
            </span>
            <span className={styles.bottom_bar_note}>{ctaNote}</span>
          </div>
          {bookNowButton()}
        </div>
      )}
    </div>
  );
}