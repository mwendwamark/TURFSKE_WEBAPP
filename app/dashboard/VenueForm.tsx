"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Button from "@/components/ui/buttons/Button";
import DashboardModal from "./DashboardModal";
import MediaPicker, { type ExistingImageItem } from "./MediaPicker";
import {
  attachVenueImagesAction,
  createVenueAction,
  deleteVenueImageAction,
  reorderVenueImagesAction,
  updateVenueAction,
} from "./actions";
import { uploadToBucket, venueImagePath } from "@/utils/supabase/images";
import { normalizeAmenityName } from "../utils/amenity";
import type { Amenity, VenueWithRelations } from "./types";
import styles from "./ManagerDashboard.module.css";

type VenueFormProps = {
  amenities: Amenity[];
  venue: VenueWithRelations | null;
  onClose: () => void;
  onSaved: () => void;
};

type GeoMessage = { type: "success" | "error"; text: string };

/** Short labels for the step indicator. Step 3's panel heading
 *  spells out "Description & Rules" in full. */
const STEPS = ["Basics", "Location", "Details", "Amenities", "Photos"] as const;

export default function VenueForm({ amenities, venue, onClose, onSaved }: VenueFormProps) {
  const editing = Boolean(venue);
  const router = useRouter();

  // ── Step state ──
  // All field state lives at the top level, so moving between steps
  // (back, next, or jumping via the indicator) never clears anything.
  const [step, setStep] = useState(0);

  const [name, setName] = useState(venue?.name ?? "");
  const [addressText, setAddressText] = useState(venue?.address_text ?? "");
  const [latitude, setLatitude] = useState(venue?.latitude != null ? String(venue.latitude) : "");
  const [longitude, setLongitude] = useState(venue?.longitude != null ? String(venue.longitude) : "");
  const [description, setDescription] = useState(venue?.description ?? "");
  const [rules, setRules] = useState(venue?.rules ?? "");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>(
    venue?.venue_amenities.map((link) => link.amenity_id) ?? [],
  );

  // Custom amenities typed into the "Add a custom amenity" box.
  // Resolved against the amenities table (case-insensitively) at
  // submit time — see resolveCustomAmenityIds in ./actions.
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [customAmenityNames, setCustomAmenityNames] = useState<string[]>([]);

  const [geoBannerVisible, setGeoBannerVisible] = useState(!editing);
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<GeoMessage | null>(null);
  const [manualEntry, setManualEntry] = useState(false);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImageItem[]>(
    venue?.venue_images
      ? [...venue.venue_images]
          .sort((a, b) => a.position - b.position)
          .map((image) => ({ id: image.id, storagePath: image.storage_path }))
      : [],
  );

  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);
  const [venueSaved, setVenueSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleAmenity(amenityId: string) {
    setSelectedAmenityIds((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId],
    );
  }

  function addCustomAmenity() {
    // Normalise the input: trim, collapse whitespace, title-case each word
    // (keeping fully‑uppercase words like "CCTV" unchanged).
    const normalised = normalizeAmenityName(customAmenityInput);

    // Validate length 2–40 characters.
    if (!normalised || normalised.length < 2 || normalised.length > 40) {
      setMessage({ type: "error", text: "Custom amenity must be between 2 and 40 characters." });
      return;
    }

    // Matches an existing catalog amenity (case-insensitively)?
    // Check that amenity instead of creating a duplicate entry.
    const catalogMatch = amenities.find(
      (amenity) => amenity.name.trim().toLowerCase() === normalised.toLowerCase(),
    );
    if (catalogMatch) {
      setSelectedAmenityIds((prev) =>
        prev.includes(catalogMatch.id) ? prev : [...prev, catalogMatch.id],
      );
      setCustomAmenityInput("");
      return;
    }

    // Already queued as a custom amenity? Ignore the repeat (case‑insensitive).
    const alreadyAdded = customAmenityNames.some(
      (queued) => queued.toLowerCase() === normalised.toLowerCase(),
    );
    if (!alreadyAdded) {
      setCustomAmenityNames((prev) => [...prev, normalised]);
    }
    setCustomAmenityInput("");
  }

  function removeCustomAmenity(customName: string) {
    setCustomAmenityNames((prev) => prev.filter((name) => name !== customName));
  }

  function dismissBannerManually() {
    setGeoBannerVisible(false);
    setManualEntry(true);
  }

  function useCurrentLocation() {
    if (locating) return;
    setMessage(null);
    setGeoMessage(null);

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocating(false);
      setGeoMessage({
        type: "error",
        text: "Your browser doesn't support location sharing. You can enter the coordinates manually below.",
      });
      setManualEntry(true);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGeoMessage({ type: "success", text: "Your current location was added." });
      },
      (error) => {
        setLocating(false);
        let text: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            text = "Location permission was denied. You can still enter the coordinates manually below.";
            break;
          case error.POSITION_UNAVAILABLE:
            text = "We couldn't get your current location. You can still enter the coordinates manually below.";
            break;
          case error.TIMEOUT:
            text = "Getting your location took too long. You can still enter the coordinates manually below.";
            break;
          default:
            text = "We couldn't get your current location. You can still enter the coordinates manually below.";
        }
        setGeoMessage({ type: "error", text });
        setManualEntry(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function handleDeleteExisting(image: ExistingImageItem) {
    if (!venue) return;
    const result = await deleteVenueImageAction(venue.id, {
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
    if (!venue) return;
    setExistingImages((prev) => {
      const byId = new Map(prev.map((item) => [item.id, item]));
      return orderedIds.map((id) => byId.get(id)).filter((item): item is ExistingImageItem => Boolean(item));
    });
    const result = await reorderVenueImagesAction(venue.id, orderedIds);
    if (result.success === false) {
      setMessage({ type: "error", text: result.error });
      router.refresh();
    }
  }

  /** Validate the current step before advancing. The server actions
   *  re-validate everything on submit — this is just early feedback. */
  function goNext() {
    if (step === 0 && !name.trim()) {
      setMessage({ type: "error", text: "Please give your venue a name." });
      return;
    }

    if (step === 1) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const coordsValid =
        latitude.trim() !== "" &&
        longitude.trim() !== "" &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180;
      if (!coordsValid) {
        setMessage({
          type: "error",
          text: "Coordinates look off — lat must be between -90 and 90, long between -180 and 180.",
        });
        return;
      }
    }

    setMessage(null);
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Guard: if not on the last step, don't save — also covers pressing
    // Enter in a text input on steps 1-4, which must not save the venue early.
    if (step < STEPS.length - 1) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    setMessage(null);

    const input = {
      name,
      addressText,
      latitude,
      longitude,
      description,
      rules,
      amenityIds: selectedAmenityIds,
      customAmenityNames,
    };

    startTransition(async () => {
      let venueId: string;

      if (venue) {
        const result = await updateVenueAction(venue.id, input);
        if (result.success === false) {
          setMessage({ type: "error", text: result.error });
          return;
        }
        venueId = venue.id;
      } else {
        const result = await createVenueAction(input);
        if (result.success === false) {
          setMessage({ type: "error", text: result.error });
          return;
        }
        venueId = result.data.venueId;
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
        const storagePath = venueImagePath(venueId, file.name);
        const resultUpload = await uploadToBucket(supabase, storagePath, file);
        if (resultUpload.ok) {
          uploaded.push({ storagePath: resultUpload.storagePath, position: existingImages.length + uploaded.length });
        } else {
          failedCount += 1;
        }
      }

      if (uploaded.length > 0) {
        await attachVenueImagesAction(venueId, uploaded);
      }

      if (failedCount > 0) {
        setVenueSaved(true);
        setMessage({
          type: "error",
          text:
            failedCount === pendingFiles.length
              ? "Your venue was saved, but we couldn't upload its photos — please try adding them again by editing the venue."
              : `Your venue was saved, but ${failedCount} photo${failedCount === 1 ? "" : "s"} couldn't be uploaded. You can add them by editing the venue.`,
        });
        router.refresh();
        return;
      }

      onSaved();
    });
  }

  const geolocationBlock = (
    <>
      {!editing && geoBannerVisible && (
        <div className={styles.geo_banner}>
          <div>
            <p className={styles.geo_banner_title}>For accurate location</p>
            <p className={styles.geo_banner_text}>
              We recommend adding this venue while you&apos;re physically at it.
            </p>
          </div>

          {locating ? (
            <p className={styles.geo_hint}>Getting your location…</p>
          ) : (
            <div className={styles.geo_banner_actions}>
              <Button type="button" variant="black" arrow={false} onClick={useCurrentLocation}>
                Use my current location
              </Button>
              <button type="button" className={styles.geo_text_btn} onClick={dismissBannerManually}>
                I&apos;ll enter manually
              </button>
              <button
                type="button"
                className={styles.geo_close_btn}
                onClick={dismissBannerManually}
                aria-label="Dismiss location prompt"
              >
                ×
              </button>
            </div>
          )}

          {geoMessage && (
            <p
              className={`${styles.geo_status} ${
                geoMessage.type === "success" ? styles.geo_status_success : styles.geo_status_error
              }`}
              role="status"
            >
              {geoMessage.text}
            </p>
          )}

          {(!geoMessage || geoMessage.type === "error") && !manualEntry && (
            <button type="button" className={styles.coords_manual_toggle} onClick={() => setManualEntry(true)}>
              Enter coordinates manually
            </button>
          )}
        </div>
      )}

      {editing && !manualEntry && (
        <button type="button" className={styles.coords_manual_toggle} onClick={() => setManualEntry(true)}>
          Edit coordinates manually
        </button>
      )}
    </>
  );

  // ── Step panels ──
  // Rendered one at a time; every field's state is held above, so
  // switching steps preserves what's already been entered.

  const basicsPanel = (
    <>
      <div className={styles.field}>
        <label htmlFor="venue-name">Venue name</label>
        <input
          id="venue-name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Kasarani Sports Ground"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="venue-address">Address</label>
        <input
          id="venue-address"
          name="address_text"
          type="text"
          value={addressText}
          onChange={(event) => setAddressText(event.target.value)}
          placeholder="e.g. Thika Road, next to Kenyatta Stadium"
        />
      </div>
    </>
  );

  const locationPanel = (
    <>
      {geolocationBlock}

      <div className={styles.row_2col}>
        <div className={styles.field}>
          <label htmlFor="venue-latitude">Latitude</label>
          <input
            id="venue-latitude"
            name="latitude"
            type="number"
            step="any"
            inputMode="decimal"
            value={latitude}
            readOnly={!manualEntry}
            onChange={(event) => setLatitude(event.target.value)}
            placeholder="e.g. -1.2189"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="venue-longitude">Longitude</label>
          <input
            id="venue-longitude"
            name="longitude"
            type="number"
            step="any"
            inputMode="decimal"
            value={longitude}
            readOnly={!manualEntry}
            onChange={(event) => setLongitude(event.target.value)}
            placeholder="e.g. 36.8812"
            required
          />
        </div>
      </div>

      <p className={styles.field_hint}>
        Coordinates are read-only by default so the location stays accurate — use your
        current location or switch to manual entry.
      </p>
    </>
  );

  const detailsPanel = (
    <>
      <div className={styles.field}>
        <label htmlFor="venue-description">Description</label>
        <textarea
          id="venue-description"
          name="description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What makes your turf worth booking?"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="venue-rules">House rules</label>
        <textarea
          id="venue-rules"
          name="rules"
          rows={4}
          value={rules}
          onChange={(event) => setRules(event.target.value)}
          placeholder="House rules players should know before booking — e.g. no metal studs, arrive 10 minutes early"
        />
      </div>

      <p className={styles.field_hint}>
        Optional — both are shown to players on your venue&apos;s page.
      </p>
    </>
  );

  const amenitiesPanel = (
    <div className={styles.field}>
      <label>Amenities</label>
      <div className={styles.checkbox_list}>
        {amenities.map((amenity) => (
          <label key={amenity.id} className={styles.checkbox_item}>
            <input
              type="checkbox"
              checked={selectedAmenityIds.includes(amenity.id)}
              onChange={() => toggleAmenity(amenity.id)}
            />
            {amenity.name}
          </label>
        ))}
        {amenities.length === 0 && (
          <p className={styles.field_hint}>No amenities available yet.</p>
        )}
      </div>

      <div className={styles.custom_amenity_row}>
        <input
          id="custom-amenity"
          type="text"
          value={customAmenityInput}
          onChange={(event) => setCustomAmenityInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustomAmenity();
            }
          }}
          placeholder="Add a custom amenity"
          aria-label="Add a custom amenity"
        />
        <Button
          type="button"
          variant="outline"
          arrow={false}
          onClick={addCustomAmenity}
          disabled={!customAmenityInput.trim() || isPending}
        >
          Add
        </Button>
      </div>

      {customAmenityNames.length > 0 && (
        <div className={styles.custom_amenity_chips}>
          {customAmenityNames.map((customName) => (
            <span key={customName} className={styles.custom_amenity_chip}>
              {customName}
              <button
                type="button"
                className={styles.custom_amenity_remove}
                onClick={() => removeCustomAmenity(customName)}
                aria-label={`Remove ${customName}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <p className={styles.field_hint}>
        Don&apos;t see what you need? Type it above — if it already exists it&apos;ll
        be matched, otherwise it&apos;s added to the catalog.
      </p>
    </div>
  );

  const photosPanel = (
    <MediaPicker
      label="Photos"
      hint="Add up to a few photos. The first one is the cover. 5MB max per photo."
      existing={existingImages}
      onDeleteExisting={handleDeleteExisting}
      onReorderExisting={handleReorderExisting}
      onPendingChange={setPendingFiles}
      disabled={isPending || venueSaved}
    />
  );

  const panels = [basicsPanel, locationPanel, detailsPanel, amenitiesPanel, photosPanel];

  return (
    <DashboardModal
      title={editing ? "Edit venue" : "Add a venue"}
      description={
        editing
          ? "Update the details of this venue."
          : "List your turf once so players can find it. Coordinates are locked until you set them."
      }
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Step indicator — click any step to jump to it. All field
            state is held above, so jumping never loses entered data. */}
        <div className={styles.steps_indicator}>
          <p className={styles.steps_text}>
            Step <strong>{step + 1}</strong> of {STEPS.length} · {STEPS[step]}
          </p>
          <div className={styles.steps_dots} role="group" aria-label="Form steps">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                className={`${styles.step_dot} ${
                  index === step
                    ? styles.step_dot_active
                    : index < step
                      ? styles.step_dot_done
                      : ""
                }`}
                onClick={() => setStep(index)}
                title={label}
                aria-label={`Step ${index + 1}: ${label}`}
                aria-current={index === step ? "step" : undefined}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {panels[step]}

        {message && (
          <p className={`${styles.form_message} ${styles.form_message_error}`} role="alert">
            {message.text}
          </p>
        )}

        <div className={styles.form_actions}>
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              arrow={false}
              onClick={() => {
                setMessage(null);
                setStep((prev) => Math.max(prev - 1, 0));
              }}
              disabled={isPending}
            >
              Back
            </Button>
          )}
          <span className={styles.form_actions_spacer} />
          <Button type="button" variant="outline" arrow={false} onClick={onClose} disabled={isPending}>
            {venueSaved ? "Close" : "Cancel"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              variant="black"
              arrow={false}
              onClick={goNext}
              disabled={isPending}
              key={`next-btn-${step}`}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="black"
              arrow={false}
              disabled={isPending || venueSaved}
              key="submit-btn"
            >
              {isPending
                ? "Saving..."
                : venueSaved
                  ? "Saved"
                  : editing
                    ? "Save changes"
                    : "Add venue"}
            </Button>
          )}
        </div>
      </form>
    </DashboardModal>
  );
}
