"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/buttons/Button";
import { createPortal } from "react-dom";
import VenueForm from "./VenueForm";
import PitchForm from "./PitchForm";
import StorageImage from "./StorageImage";
import type { Amenity, PayoutStatus, Pitch, VenueWithRelations } from "./types";
import styles from "./ManagerDashboard.module.css";

type ModalState =
  | { type: "venue"; venue: VenueWithRelations | null }
  | { type: "pitch"; venue: VenueWithRelations; pitch: Pitch | null }
  | null;

type ManagerDashboardProps = {
  venues: VenueWithRelations[];
  amenities: Amenity[];
  payout: PayoutStatus;
};

export default function ManagerDashboard({ venues, amenities, payout }: ManagerDashboardProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);

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
        <div>
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
          onClick={() => setModal({ type: "venue", venue: null })}
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
            onClick={() => setModal({ type: "venue", venue: null })}
          >
            Add your first venue
          </Button>
        </div>
      ) : (
        <div className={styles.venue_grid}>
          {venues.map((venue) => {
            const isExpanded = expandedVenueId === venue.id;
            const allImages = [...venue.venue_images].sort((a, b) => a.position - b.position);
            const cover = allImages[0];

            return (
              <div key={venue.id} className={styles.venue_card}>
                {cover ? (
                  <div className={styles.venue_cover}>
                    <StorageImage
                      storagePath={cover.storage_path}
                      alt={`${venue.name}`}
                      sizes="(max-width: 900px) 90vw, 360px"
                    />
                  </div>
                ) : (
                  <div className={styles.venue_cover_fallback}>No photo yet</div>
                )}

                {allImages.length > 1 && (
                  <div className={styles.venue_thumbs}>
                    {allImages.slice(1, 5).map((image) => (
                      <div key={image.id} className={styles.venue_thumb}>
                        <StorageImage
                          storagePath={image.storage_path}
                          alt={`${venue.name} photo`}
                          sizes="72px"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.venue_card_header}>
                  <div>
                    <h3 className={styles.venue_name}>{venue.name}</h3>
                    {venue.address_text && <p className={styles.venue_sub}>{venue.address_text}</p>}
                    {venue.latitude != null && venue.longitude != null && (
                      <p className={styles.venue_coords}>
                        {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    arrow={false}
                    className={styles.venue_edit_btn}
                    onClick={() => setModal({ type: "venue", venue })}
                  >
                    Edit
                  </Button>
                </div>

                {venue.venue_amenities.length > 0 && (
                  <div className={styles.chip_row}>
                    {venue.venue_amenities.map((link) => {
                      const amenity = amenities.find((a) => a.id === link.amenity_id);
                      return amenity ? (
                        <span key={link.amenity_id} className={styles.chip}>
                          {amenity.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                <div className={styles.card_footer}>
                  <p className={styles.pitch_count}>
                    {venue.pitches.length === 0
                      ? "No pitches yet"
                      : venue.pitches.length === 1
                        ? "1 pitch"
                        : `${venue.pitches.length} pitches`}
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    arrow={false}
                    onClick={() => setExpandedVenueId(isExpanded ? null : venue.id)}
                  >
                    {isExpanded ? "Hide pitches" : "Manage pitches"}
                  </Button>
                </div>

                {isExpanded && (
                  <div className={styles.pitches_panel}>
                    {venue.pitches.length === 0 && (
                      <p className={styles.no_pitches}>
                        No pitches yet. Add one to start offering bookings for this venue.
                      </p>
                    )}

                    {venue.pitches.map((pitch) => (
                      <div key={pitch.id} className={styles.pitch_row}>
                        <div>
                          <p className={styles.pitch_name}>
                            {pitch.name}
                            <span
                              className={`${styles.status_badge} ${
                                pitch.status === "inactive"
                                  ? styles.status_inactive
                                  : styles.status_active
                              }`}
                            >
                              {pitch.status}
                            </span>
                          </p>
                          <p className={styles.pitch_meta}>
                            {pitch.size}
                            {pitch.surface_type ? ` · ${pitch.surface_type}` : ""}
                            {pitch.price_per_hour != null
                              ? ` · KES ${pitch.price_per_hour.toLocaleString()}/hr`
                              : ""}
                          </p>
                          {pitch.pitch_images && pitch.pitch_images.length > 0 && (
                            <div className={styles.pitch_thumbs}>
                              {[...pitch.pitch_images]
                                .sort((a, b) => a.position - b.position)
                                .slice(0, 3)
                                .map((image) => (
                                  <div key={image.id} className={styles.pitch_thumb}>
                                    <StorageImage
                                      storagePath={image.storage_path}
                                      alt={pitch.name}
                                      sizes="60px"
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          arrow={false}
                          className={styles.pitch_edit_btn}
                          onClick={() => setModal({ type: "pitch", venue, pitch })}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="primary"
                      arrow={false}
                      className={styles.add_pitch_btn}
                      onClick={() => setModal({ type: "pitch", venue, pitch: null })}
                    >
                      Add pitch
                    </Button>
                  </div>
                )}
              </div>
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
      {typeof document !== "undefined" && modal?.type === "pitch"
        ? createPortal(
            <PitchForm
              venueId={modal.venue.id}
              pitch={modal.pitch}
              onClose={closeModal}
              onSaved={handleSaved}
            />,
            document.body,
          )
        : null}
    </>
  );
}