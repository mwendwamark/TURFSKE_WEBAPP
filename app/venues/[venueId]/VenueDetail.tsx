"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Armchair,
  CircleParking,
  Droplet,
  Lightbulb,
  MapPin,
  Shirt,
  Sparkles,
  Toilet,
  Square,
  Wifi,
  User,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import ImageGallery from "../../dashboard/ImageGallery";
import StorageImage from "../../dashboard/StorageImage";
import Button from "../../../components/ui/buttons/Button";
import RoleNoticeBanner from "../../../components/auth/RoleNoticeBanner";
import type { VenueWithRelations } from "../../dashboard/types";
import styles from "./VenueDetail.module.css";

/**
 * What the Book now / Select buttons should do, decided
 * server-side on the venue page:
 *
 * - guest   → link to /auth/signup carrying ?next=<venue path>
 * - player  → booking isn't built yet (Phase 4), so show an
 *             inline "coming soon" disabled state. Never a link —
 *             the proxy silently bounces signed-in users away from
 *             /auth/signup to /dashboard.
 * - notice  → the account's role means it can't book (manager,
 *             admin, …). Show the RoleNoticeBanner pattern with an
 *             inline message; no redirect.
 */
export type BookingAuthState =
  | { kind: "guest" }
  | { kind: "player" }
  | { kind: "notice"; message: ReactNode };

/**
 * Amenity name → icon. Keys are lowercase; matching is normalized, so
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
  bibs: Square,
  canteen: Utensils,
  wifi: Wifi,
  "balls provided": Square,
  "referee available": User,
  "spectator seating": Armchair,
  "first aid": Square,
};

const AMENITY_FALLBACK_ICON: LucideIcon = Sparkles;

function amenityIcon(name: string): LucideIcon {
  return AMENITY_ICONS[name.trim().toLowerCase()] ?? AMENITY_FALLBACK_ICON;
}

function pitchCover(pitch: VenueWithRelations["pitches"][number]) {
  return (
    [...(pitch.pitch_images ?? [])].sort((a, b) => a.position - b.position)[0] ??
    null
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
  const amenityNames = venue.venue_amenities
    .map((link) => link.amenities?.name)
    .filter((name): name is string => Boolean(name));
  const prices = activePitches
    .map((p) => p.price_per_hour)
    .filter((price): price is number => price != null);
  const fromPrice = prices.length > 0 ? Math.min(...prices) : null;

  // Signed-in users are never sent to /auth/signup — the proxy
  // bounces them to /dashboard, which would silently swallow the
  // booking action. Guests get the signup link with a ?next
  // return path instead.
  const bookingHref = `/auth/signup?next=${encodeURIComponent(
    `/venues/${venue.id}`,
  )}`;
  const isGuest = auth.kind === "guest";

  function bookNowButton(className?: string) {
    if (isGuest) {
      return (
        <Button variant="primary" href={bookingHref} className={className}>
          Book now
        </Button>
      );
    }
    if (auth.kind === "player") {
      return (
        <Button variant="primary" className={className} disabled>
          Booking is coming soon
        </Button>
      );
    }
    return (
      <Button variant="primary" className={className} disabled>
        Book now
      </Button>
    );
  }

  function selectButton() {
    if (isGuest) {
      return (
        <Button variant="outline" href={bookingHref}>
          Select
        </Button>
      );
    }
    if (auth.kind === "player") {
      return (
        <Button variant="outline" disabled>
          Booking is coming soon
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
      ? "Bookings open soon"
      : "Create a separate player account to book";

  return (
    <div className={` section ${styles.detail}`}>
      <Link href="/explore" className={styles.back_link}>
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      {auth.kind === "notice" && <RoleNoticeBanner message={auth.message} />}

      <div className={ `${styles.layout}`}>
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

          <section className={styles.section}>
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
                              {formatPrice(pitch.price_per_hour)}
                              <span className={styles.pitch_price_period}>
                                /hr
                              </span>
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
                        </div>
                      </div>

                      <div className={styles.pitch_actions}>
                        {selectButton()}
                      </div>
                    </li>
                  );
                })}
              </ul>
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
