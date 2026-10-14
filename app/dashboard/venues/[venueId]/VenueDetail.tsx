"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowLeft, ImageOff, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import DashboardModal from "../../DashboardModal";
import ImageGallery from "../../ImageGallery";
import PitchForm from "../../PitchForm";
import StorageImage from "../../StorageImage";
import VenueForm from "../../VenueForm";
import { deletePitchAction, deleteVenueAction } from "../../actions";
import type { Amenity, Pitch, VenueWithRelations } from "../../types";
import styles from "./VenueDetail.module.css";
type ModalState =
  | { type: "edit-venue" }
  | { type: "pitch"; pitch: Pitch | null }
  | { type: "delete-venue" }
  | { type: "delete-pitch"; pitch: Pitch }
  | null;

type VenueDetailProps = {
  venue: VenueWithRelations;
  amenities: Amenity[];
};

function pitchCover(pitch: Pitch) {
  return [...(pitch.pitch_images ?? [])].sort((a, b) => a.position - b.position)[0] ?? null;
}

export default function VenueDetail({ venue, amenities }: VenueDetailProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pitches = venue.pitches ?? [];

  function closeModal() {
    if (isPending) return;
    setModal(null);
    setMessage(null);
  }

  function handleSaved() {
    setModal(null);
    setMessage(null);
    router.refresh();
  }

  function handleDeleteVenue() {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteVenueAction(venue.id);
      if (result.success === false) {
        setMessage(result.error);
        return;
      }
      router.push("/dashboard/venues");
    });
  }

  function handleDeletePitch(pitch: Pitch) {
    setMessage(null);
    startTransition(async () => {
      const result = await deletePitchAction(pitch.id);
      if (result.success === false) {
        setMessage(result.error);
        return;
      }
      setModal(null);
      setMessage(null);
      router.refresh();
    });
  }

  const messageBlock = message ? (
    <p className={`${styles.message} ${styles.message_error}`} role="alert">
      {message}
    </p>
  ) : null;

  return (
    <div className={styles.detail}>
      <Link href="/dashboard/venues" className={styles.back_link}>
        <ArrowLeft size={16} />
        My Venues
      </Link>

      <ImageGallery
        images={venue.venue_images}
        alt={venue.name}
        variant="detail"
        sizes="(max-width: 900px) 92vw, 720px"
      />

      <div className={styles.head}>
        <div className={styles.head_text}>
          <h2 className={styles.title}>{venue.name}</h2>
          {venue.address_text && <p className={styles.address}>{venue.address_text}</p>}
          {venue.latitude != null && venue.longitude != null && (
            <p className={styles.coords}>
              <MapPin size={14} aria-hidden="true" />
              {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
            </p>
          )}
        </div>

        <div className={styles.head_actions}>
          <Button
            type="button"
            variant="outline"
            iconOnly
            icon={<Pencil />}
            title="Edit venue"
            onClick={() => {
              setMessage(null);
              setModal({ type: "edit-venue" });
            }}
          >
            Edit venue
          </Button>
          <Button
            type="button"
            variant="danger"
            iconOnly
            icon={<Trash2 />}
            title="Delete venue"
            onClick={() => {
              setMessage(null);
              setModal({ type: "delete-venue" });
            }}
          >
            Delete venue
          </Button>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.section_title}>Amenities</h3>
        {venue.venue_amenities.length > 0 ? (
          <div className={styles.chips}>
            {venue.venue_amenities.map((link) => {
              const name =
                link.amenities?.name ??
                amenities.find((amenity) => amenity.id === link.amenity_id)?.name;
              return name ? (
                <span key={link.amenity_id} className={styles.chip}>
                  {name}
                </span>
              ) : null;
            })}
          </div>
        ) : (
          <p className={styles.section_empty}>No amenities added yet.</p>
        )}
      </section>

      {(venue.description || venue.rules) && (
        <section className={styles.section}>
          {venue.description && (
            <div className={styles.text_block}>
              <h3 className={styles.section_title}>Description</h3>
              <p className={styles.section_text}>{venue.description}</p>
            </div>
          )}
          {venue.rules && (
            <div className={styles.text_block}>
              <h3 className={styles.section_title}>House rules</h3>
              <p className={styles.section_text}>{venue.rules}</p>
            </div>
          )}
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.section_head}>
          <h3 className={styles.section_title}>
            Pitches{" "}
            <span className={styles.section_count}>
              {pitches.length === 0
                ? "None yet"
                : pitches.length === 1
                  ? "1 pitch"
                  : `${pitches.length} pitches`}
            </span>
          </h3>
          <Button
            type="button"
            variant="black"
            icon={<Plus />}
            onClick={() => {
              setMessage(null);
              setModal({ type: "pitch", pitch: null });
            }}
            className={styles.section_add}
          >
            Add pitch
          </Button>
        </div>

        {pitches.length === 0 ? (
          <p className={styles.section_empty}>
            No pitches yet. Add one so players can see what you offer and book it.
          </p>
        ) : (
          <ul className={styles.pitch_list}>
            {pitches.map((pitch) => {
              const cover = pitchCover(pitch);
              return (
                <li key={pitch.id} className={styles.pitch_row}>
                  <div className={styles.pitch_thumb}>
                    {cover ? (
                      <StorageImage
                        storagePath={cover.storage_path}
                        alt={pitch.name}
                        sizes="88px"
                        className={styles.pitch_thumb_image}
                      />
                    ) : (
                      <ImageOff size={18} aria-hidden="true" />
                    )}
                  </div>

                  <div className={styles.pitch_info}>
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
                    <p className={styles.pitch_opens}>
                      Opens {pitch.opens_at.slice(0, 5)} to {pitch.closes_at.slice(0, 5)}
                    </p>
                  </div>

                  <div className={styles.pitch_actions}>
                    <Button
                      type="button"
                      variant="outline"
                      iconOnly
                      icon={<Pencil />}
                      title={`Edit ${pitch.name}`}
                      onClick={() => {
                        setMessage(null);
                        setModal({ type: "pitch", pitch });
                      }}
                    >
                      Edit {pitch.name}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      iconOnly
                      icon={<Trash2 />}
                      title={`Delete ${pitch.name}`}
                      onClick={() => {
                        setMessage(null);
                        setModal({ type: "delete-pitch", pitch });
                      }}
                    >
                      Delete {pitch.name}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {typeof document !== "undefined" && modal?.type === "edit-venue"
        ? createPortal(
            <VenueForm
              amenities={amenities}
              venue={venue}
              onClose={closeModal}
              onSaved={handleSaved}
            />,
            document.body,
          )
        : null}

      {typeof document !== "undefined" && modal?.type === "pitch"
        ? createPortal(
            <PitchForm
              venueId={venue.id}
              pitch={modal.pitch}
              onClose={closeModal}
              onSaved={handleSaved}
            />,
            document.body,
          )
        : null}

      {typeof document !== "undefined" && modal?.type === "delete-venue"
        ? createPortal(
            <DashboardModal
              title={`Delete ${venue.name}?`}
              description="This removes the venue, all of its pitches and their photos. This can't be undone."
              onClose={closeModal}
            >
              {messageBlock}
              <div className={styles.confirm_actions}>
                <Button type="button" variant="outline" onClick={closeModal} disabled={isPending}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDeleteVenue}
                  disabled={isPending}
                >
                  {isPending ? "Deleting..." : "Delete venue"}
                </Button>
              </div>
            </DashboardModal>,
            document.body,
          )
        : null}

      {typeof document !== "undefined" && modal?.type === "delete-pitch"
        ? createPortal(
            <DashboardModal
              title={`Delete ${modal.pitch.name}?`}
              description="This removes the pitch and its photos from this venue. This can't be undone."
              onClose={closeModal}
            >
              {messageBlock}
              <div className={styles.confirm_actions}>
                <Button type="button" variant="outline" onClick={closeModal} disabled={isPending}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => handleDeletePitch(modal.pitch)}
                  disabled={isPending}
                >
                  {isPending ? "Deleting..." : "Delete pitch"}
                </Button>
              </div>
            </DashboardModal>,
            document.body,
          )
        : null}
    </div>
  );
}
