"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Button from "@/components/ui/buttons/Button";
import DashboardModal from "./DashboardModal";
import MediaPicker, { type ExistingImageItem } from "./MediaPicker";
import {
  attachPitchImagesAction,
  createPitchAction,
  deletePitchImageAction,
  reorderPitchImagesAction,
  updatePitchAction,
} from "./actions";
import { pitchImagePath, uploadToBucket } from "@/utils/supabase/images";
import type { Pitch } from "./types";
import styles from "./ManagerDashboard.module.css";

const SIZE_OPTIONS = ["5-a-side", "7-a-side", "11-a-side"] as const;

type PitchFormProps = {
  venueId: string;
  pitch: Pitch | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function PitchForm({ venueId, pitch, onClose, onSaved }: PitchFormProps) {
  const editing = Boolean(pitch);
  const router = useRouter();

  const [name, setName] = useState(pitch?.name ?? "");
  const [sportType, setSportType] = useState(pitch?.sport_type ?? "Football");
  const [size, setSize] = useState(pitch?.size ?? "7-a-side");
  const [pricePerHour, setPricePerHour] = useState(
    pitch?.price_per_hour != null ? String(pitch.price_per_hour) : "",
  );
  const [surfaceType, setSurfaceType] = useState(pitch?.surface_type ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(
    pitch?.status === "inactive" ? "inactive" : "active",
  );

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImageItem[]>(
    pitch?.pitch_images
      ? [...pitch.pitch_images]
          .sort((a, b) => a.position - b.position)
          .map((image) => ({ id: image.id, storagePath: image.storage_path }))
      : [],
  );

  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);
  const [pitchSaved, setPitchSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleDeleteExisting(image: ExistingImageItem) {
    if (!pitch) return;
    const result = await deletePitchImageAction(pitch.id, {
      id: image.id,
      storagePath: image.storagePath,
    });
    if (result.success === false) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setExistingImages((prev) => prev.filter((item) => item.id !== image.id));
    router.refresh();
  }

  async function handleReorderExisting(orderedIds: string[]) {
    if (!pitch) return;
    setExistingImages((prev) => {
      const byId = new Map(prev.map((item) => [item.id, item]));
      return orderedIds.map((id) => byId.get(id)).filter((item): item is ExistingImageItem => Boolean(item));
    });
    const result = await reorderPitchImagesAction(pitch.id, orderedIds);
    if (result.success === false) {
      setMessage({ type: "error", text: result.error });
      router.refresh();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const input = {
      name,
      sportType,
      size,
      pricePerHour,
      surfaceType,
      status,
    };

    startTransition(async () => {
      let createdPitchId: string;

      if (pitch) {
        const result = await updatePitchAction(pitch.id, input);
        if (result.success === false) {
          setMessage({ type: "error", text: result.error });
          return;
        }
        createdPitchId = pitch.id;
      } else {
        const result = await createPitchAction(venueId, input);
        if (result.success === false) {
          setMessage({ type: "error", text: result.error });
          return;
        }
        createdPitchId = result.data.pitchId;
      }

      if (pendingFiles.length === 0) {
        onSaved();
        return;
      }

      const supabase = createClient();
      const uploaded: { storagePath: string; position: number }[] = [];
      let failedCount = 0;

      for (let i = 0; i < pendingFiles.length; i += 1) {
        const file = pendingFiles[i];
        const storagePath = pitchImagePath(venueId, createdPitchId, file.name);
        const resultUpload = await uploadToBucket(supabase, storagePath, file);
        if (resultUpload.ok) {
          uploaded.push({ storagePath: resultUpload.storagePath, position: existingImages.length + uploaded.length });
        } else {
          failedCount += 1;
        }
      }

      if (uploaded.length > 0) {
        await attachPitchImagesAction(createdPitchId, uploaded);
      }

      if (failedCount > 0) {
        setPitchSaved(true);
        setMessage({
          type: "error",
          text:
            failedCount === pendingFiles.length
              ? "Your pitch was saved, but we couldn't upload its photos — please try adding them again by editing the pitch."
              : `Your pitch was saved, but ${failedCount} photo${failedCount === 1 ? "" : "s"} couldn't be uploaded. You can add them by editing the pitch.`,
        });
        router.refresh();
        return;
      }

      onSaved();
    });
  }

  return (
    <DashboardModal
      title={editing ? "Edit pitch" : "Add a pitch"}
      description={
        editing
          ? "Update this pitch's details."
          : "Add a pitch so players can see what you offer and what it costs to book."
      }
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="pitch-name">Pitch name</label>
          <input
            id="pitch-name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Main Pitch"
            required
          />
        </div>

        <div className={styles.row_2col}>
          <div className={styles.field}>
            <label htmlFor="pitch-sport">Sport</label>
            <input
              id="pitch-sport"
              name="sport_type"
              type="text"
              value={sportType}
              onChange={(event) => setSportType(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="pitch-size">Size</label>
            <select
              id="pitch-size"
              name="size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
            >
              {SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="pitch-price">Price per hour (KES)</label>
          <input
            id="pitch-price"
            name="price_per_hour"
            type="number"
            min="0"
            inputMode="numeric"
            value={pricePerHour}
            onChange={(event) => setPricePerHour(event.target.value)}
            placeholder="e.g. 1500"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="pitch-surface">Surface type</label>
          <input
            id="pitch-surface"
            name="surface_type"
            type="text"
            value={surfaceType}
            onChange={(event) => setSurfaceType(event.target.value)}
            placeholder="e.g. Artificial turf"
          />
        </div>

        <div className={styles.field}>
          <span>Availability</span>
          <div className={styles.toggle_group} role="group" aria-label="Pitch availability">
            <button
              type="button"
              className={`${styles.toggle_btn} ${status === "active" ? styles.toggle_btn_active : ""}`}
              onClick={() => setStatus("active")}
            >
              Active
            </button>
            <button
              type="button"
              className={`${styles.toggle_btn} ${status === "inactive" ? styles.toggle_btn_active : ""}`}
              onClick={() => setStatus("inactive")}
            >
              Inactive
            </button>
          </div>
          <p className={styles.field_hint}>
            Inactive pitches are hidden from players but kept in your list.
          </p>
        </div>

        <MediaPicker
          label="Photos"
          hint="Add photos of this pitch. The first one is the cover. 5MB max per photo."
          existing={existingImages}
          onDeleteExisting={handleDeleteExisting}
          onReorderExisting={handleReorderExisting}
          onPendingChange={setPendingFiles}
          disabled={isPending || pitchSaved}
        />

        {message && (
          <p className={`${styles.form_message} ${styles.form_message_error}`} role="alert">
            {message.text}
          </p>
        )}

        <div className={styles.form_actions}>
          <Button type="button" variant="outline" arrow={false} onClick={onClose} disabled={isPending}>
            {pitchSaved ? "Close" : "Cancel"}
          </Button>
          <Button type="submit" variant="black" arrow={false} disabled={isPending || pitchSaved}>
            {isPending
              ? "Saving..."
              : pitchSaved
                ? "Saved"
                : editing
                  ? "Save changes"
                  : "Add pitch"}
          </Button>
        </div>
      </form>
    </DashboardModal>
  );
}