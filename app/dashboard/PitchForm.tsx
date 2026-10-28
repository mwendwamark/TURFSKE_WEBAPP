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
const OPEN_HOURS = Array.from(
  { length: 24 },
  (_, h) => `${String(h).padStart(2, "0")}:00`,
);
const CLOSE_HOURS = Array.from(
  { length: 24 },
  (_, h) => `${String(h + 1).padStart(2, "0")}:00`,
);

type PitchFormProps = {
  venueId: string;
  pitch: Pitch | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function PitchForm({
  venueId,
  pitch,
  onClose,
  onSaved,
}: PitchFormProps) {
  const editing = Boolean(pitch);
  const router = useRouter();

  // Pricing model: "per_pitch" or "per_person"
  const [pricingModel, setPricingModel] = useState<"per_pitch" | "per_person">(
    pitch?.pricing_model ?? "per_pitch",
  );

  const [name, setName] = useState(pitch?.name ?? "");
  const [sportType, setSportType] = useState(pitch?.sport_type ?? "Football");
  const [size, setSize] = useState(pitch?.size ?? "7-a-side");
  const [pricePerHour, setPricePerHour] = useState<string | null>(
    pitch?.price_per_hour != null ? String(pitch.price_per_hour) : null,
  );
  const [surfaceType, setSurfaceType] = useState(pitch?.surface_type ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(
    pitch?.status === "inactive" ? "inactive" : "active",
  );
  const [opensAt, setOpensAt] = useState<string>(
    pitch?.opens_at?.slice(0, 5) ?? "06:00",
  );
  const [closesAt, setClosesAt] = useState<string>(
    pitch?.closes_at?.slice(0, 5) ?? "22:00",
  );

  // New: min/max players for per-person pricing
  const [minPlayers, setMinPlayers] = useState<number | null>(
    pitch?.min_players ?? null,
  );
  const [maxPlayers, setMaxPlayers] = useState<number | null>(
    pitch?.max_players ?? null,
  );

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImageItem[]>(
    pitch?.pitch_images
      ? [...pitch.pitch_images]
          .sort((a, b) => a.position - b.position)
          .map((image) => ({ id: image.id, storagePath: image.storage_path }))
      : [],
  );

  const [message, setMessage] = useState<{
    type: "error";
    text: string;
  } | null>(null);
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
      return orderedIds
        .map((id) => byId.get(id))
        .filter((item): item is ExistingImageItem => Boolean(item));
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

    if (closesAt <= opensAt) {
      setMessage({
        type: "error",
        text: "Closing time must be after opening time.",
      });
      return;
    }

    // Client-side validation for player range
    if (pricingModel === "per_person") {
      if (minPlayers == null || maxPlayers == null) {
        setMessage({
          type: "error",
          text: "Minimum and maximum players are required for per-person pricing.",
        });
        return;
      }
      if (minPlayers < 1 || minPlayers > 200) {
        setMessage({
          type: "error",
          text: "Minimum players must be between 1 and 200.",
        });
        return;
      }
      if (maxPlayers < 1 || maxPlayers > 200) {
        setMessage({
          type: "error",
          text: "Maximum players must be between 1 and 200.",
        });
        return;
      }
      if (minPlayers > maxPlayers) {
        setMessage({
          type: "error",
          text: "Minimum players must be less than or equal to maximum players.",
        });
        return;
      }
    }

    const input = {
      name,
      sportType,
      size,
      pricePerHour: pricePerHour ?? "",
      pricingModel,
      minPlayers,
      maxPlayers,
      surfaceType,
      status,
      opens_at: opensAt,
      closes_at: closesAt,
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
          uploaded.push({
            storagePath: resultUpload.storagePath,
            position: existingImages.length + uploaded.length,
          });
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
          <label htmlFor="pitch-price">
            {pricingModel === "per_person"
              ? "Price per person per hour (KES)"
              : "Price per hour (KES)"}
          </label>{" "}
          <input
            id="pitch-price"
            name="price_per_hour"
            type="number"
            min="0"
            inputMode="numeric"
            value={pricePerHour ?? ""}
            onChange={(event) => setPricePerHour(event.target.value || null)}
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
          <span>How do you charge?</span>
          <div
            className={styles.toggle_group}
            role="group"
            aria-label="Pricing model"
          >
            <button
              type="button"
              className={`${styles.toggle_btn} ${pricingModel === "per_pitch" ? styles.toggle_btn_active : ""}`}
              onClick={() => setPricingModel("per_pitch")}
            >
              Per pitch
            </button>
            <button
              type="button"
              className={`${styles.toggle_btn} ${pricingModel === "per_person" ? styles.toggle_btn_active : ""}`}
              onClick={() => setPricingModel("per_person")}
            >
              Per person
            </button>
          </div>
          <p className={styles.field_hint}>
            Per person: the player pays the rate times the number of people they
            bring.
          </p>
        </div>

        {pricingModel === "per_person" ? (
          <div className={styles.row_2col}>
            <div className={styles.field}>
              <label htmlFor="pitch-min-players">Minimum players</label>
              <input
                id="pitch-min-players"
                name="min_players"
                type="number"
                min="1"
                max="200"
                value={minPlayers ?? ""}
                onChange={(event) =>
                  setMinPlayers(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                placeholder="e.g. 5"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="pitch-max-players">Maximum players</label>
              <input
                id="pitch-max-players"
                name="max_players"
                type="number"
                min="1"
                max="200"
                value={maxPlayers ?? ""}
                onChange={(event) =>
                  setMaxPlayers(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                placeholder="e.g. 10"
                required
              />
            </div>
          </div>
        ) : (
          <div className={styles.field}>
            <label htmlFor="pitch-max-players">
              Maximum players (optional)
            </label>
            <input
              id="pitch-max-players"
              name="max_players"
              type="number"
              min="1"
              max="200"
              value={maxPlayers ?? ""}
              onChange={(event) =>
                setMaxPlayers(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              placeholder="e.g. 10"
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="pitch-opens">Opens</label>
          <select
            id="pitch-opens"
            name="opens_at"
            value={opensAt}
            onChange={(event) => setOpensAt(event.target.value)}
          >
            {OPEN_HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="pitch-closes">Closes</label>
          <select
            id="pitch-closes"
            name="closes_at"
            value={closesAt}
            onChange={(event) => setClosesAt(event.target.value)}
          >
            {CLOSE_HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <span>Availability</span>
          <div
            className={styles.toggle_group}
            role="group"
            aria-label="Pitch availability"
          >
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
          <p
            className={`${styles.form_message} ${styles.form_message_error}`}
            role="alert"
          >
            {message.text}
          </p>
        )}

        <div className={styles.form_actions}>
          <Button
            type="button"
            variant="outline"
            arrow={false}
            onClick={onClose}
            disabled={isPending}
          >
            {pitchSaved ? "Close" : "Cancel"}
          </Button>
          <Button
            type="submit"
            variant="black"
            arrow={false}
            disabled={isPending || pitchSaved}
          >
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
