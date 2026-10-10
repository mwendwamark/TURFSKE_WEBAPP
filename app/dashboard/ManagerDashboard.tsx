"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Plus } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import ImageGallery from "./ImageGallery";
import VenueForm from "./VenueForm";
import type { Amenity, PayoutStatus, Pitch, VenueWithRelations } from "./types";
import styles from "./ManagerDashboard.module.css";

type ModalState = { type: "venue"; venue: VenueWithRelations | null } | null;

type ManagerDashboardProps = {
  venues: VenueWithRelations[];
  amenities: Amenity[];
  payout: PayoutStatus;
};

/**
 * Lowest hourly rate a player can actually book at this venue.
 * Inactive pitches are hidden from players, so they don't count toward the
 * "From" price. Ties resolve to the same number either way, and the value is
 * displayed exactly as stored (no rounding) so "From KES X/hr" never
 * understates the real price. Returns null when nothing is bookable yet.
 */
function lowestHourlyPrice(pitches: Pitch[]): number | null {
  let lowest: number | null = null;

  for (const pitch of pitches) {
    if (pitch.status === "inactive" || pitch.price_per_hour == null) continue;
    if (lowest === null || pitch.price_per_hour < lowest) {
      lowest = pitch.price_per_hour;
    }
  }

  return lowest;
}

export default function ManagerDashboard({ venues, amenities, payout }: ManagerDashboardProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);

  function closeModal() {
    setModal(null);
  }

  function handleSaved() {
    setModal(null);
    router.refresh();
  }

  return (
    <>
      {payout.paystackSubaccountCode == null && (
        <div className={styles.payout_banner}>
          <div>
            <p className={styles.payout_banner_title}>Set up payouts</p>
            <p className={styles.payout_banner_text}>
              Add a payout account so you can receive money when players book your turf.
            </p>
          </div>
          <Button href="/dashboard/payouts" variant="black" arrow={false}>
            Set up payouts
          </Button>
        </div>
      )}

      <div className={styles.venues_header}>
        <div className={styles.venues_header_titles}>
          <h2 className={styles.venues_title}>My Venues</h2>
          <p className={styles.venues_sub}>
            {venues.length === 0
              ? "Add your first venue to start taking bookings."
              : venues.length === 1
                ? "1 venue managed by you"
                : `${venues.length} venues managed by you`}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          icon={<Plus />}
          onClick={() => setModal({ type: "venue", venue: null })}
          className={styles.venues_add}
        >
          Add venue
        </Button>
      </div>

      {venues.length === 0 ? (
        <div className={styles.empty_state}>
          <p className={styles.empty_state_title}>No venues yet</p>
          <p className={styles.empty_state_text}>
            Add your turf so players can find it, see its pitches and prices, and book it online.
          </p>
          <Button
            type="button"
            variant="primary"
            icon={<Plus />}
            onClick={() => setModal({ type: "venue", venue: null })}
          >
            Add your first venue
          </Button>
        </div>
      ) : (
        <div className={styles.venue_grid}>
          {venues.map((venue) => {
            const fromPrice = lowestHourlyPrice(venue.pitches);
            const location =
              venue.address_text ??
              (venue.latitude != null && venue.longitude != null
                ? `${venue.latitude.toFixed(4)}, ${venue.longitude.toFixed(4)}`
                : null);

            return (
              <Link
                key={venue.id}
                href={`/dashboard/venues/${venue.id}`}
                className={styles.venue_card}
              >
                <ImageGallery
                  images={venue.venue_images}
                  alt={venue.name}
                  variant="card"
                  sizes="(max-width: 900px) 92vw, 360px"
                />

                <div className={styles.venue_card_body}>
                  <h3 className={styles.venue_name}>{venue.name}</h3>
                  {location && <p className={styles.venue_sub}>{location}</p>}
                  {fromPrice !== null && (
                    <p className={styles.venue_price}>
                      From KES {fromPrice.toLocaleString()}/hr
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {typeof document !== "undefined" && modal?.type === "venue"
        ? createPortal(
            <VenueForm
              amenities={amenities}
              venue={modal.venue}
              onClose={closeModal}
              onSaved={handleSaved}
            />,
            document.body,
          )
        : null}
    </>
  );
}
