"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import StorageImage from "./StorageImage";
import { MAX_IMAGE_SIZE } from "@/utils/supabase/images";
import styles from "./ManagerDashboard.module.css";

export type ExistingImageItem = {
  id: string;
  storagePath: string;
};

type PendingItem = {
  id: string;
  file: File;
  url: string;
};

type MediaPickerProps = {
  label: string;
  hint: string;
  existing: ExistingImageItem[];
  onDeleteExisting: (image: ExistingImageItem) => void;
  onReorderExisting: (orderedIds: string[]) => void;
  onPendingChange: (files: File[]) => void;
  disabled?: boolean;
};

export default function MediaPicker({
  label,
  hint,
  existing,
  onDeleteExisting,
  onReorderExisting,
  onPendingChange,
  disabled,
}: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      pending.forEach((item) => URL.revokeObjectURL(item.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setMessage(null);

    const next: PendingItem[] = [];
    const rejected: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name} isn't an image file.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        rejected.push(`${file.name} is over 5MB — please choose a smaller image.`);
        return;
      }
      next.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
    });

    if (rejected.length > 0) {
      setMessage(rejected[0]);
    }

    const combined = [...pending, ...next];
    setPending(combined);
    onPendingChange(combined.map((item) => item.file));
  }

  function removePending(id: string) {
    const next = pending.filter((item) => item.id !== id);
    setPending(next);
    onPendingChange(next.map((item) => item.file));
  }

  function movePending(id: string, direction: -1 | 1) {
    const index = pending.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= pending.length) return;

    const next = [...pending];
    [next[index], next[target]] = [next[target], next[index]];
    setPending(next);
    onPendingChange(next.map((item) => item.file));
  }

  function moveExisting(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= existing.length) return;

    const next = [...existing];
    [next[index], next[target]] = [next[target], next[index]];
    onReorderExisting(next.map((item) => item.id));
  }

  return (
    <div className={styles.media_field}>
      <div className={styles.media_field_head}>
        <div>
          <span className={styles.media_label}>{label}</span>
          <p className={styles.field_hint}>{hint}</p>
        </div>
        <button
          type="button"
          className={styles.media_add_btn}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <ImagePlus size={16} />
          Add photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.media_input_hidden}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {message && (
        <p className={`${styles.form_message} ${styles.form_message_error}`} role="alert">
          {message}
        </p>
      )}

      {(existing.length > 0 || pending.length > 0) && (
        <ul className={styles.media_grid}>
          {existing.map((image, index) => (
            <li key={image.id} className={styles.media_item}>
              <div className={styles.media_thumb}>
                <StorageImage
                  storagePath={image.storagePath}
                  alt="Venue photo"
                  sizes="160px"
                />
              </div>
              <div className={styles.media_actions}>
                <button
                  type="button"
                  className={styles.media_icon_btn}
                  onClick={() => moveExisting(index, -1)}
                  disabled={index === 0}
                  aria-label="Move photo up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className={styles.media_icon_btn}
                  onClick={() => moveExisting(index, 1)}
                  disabled={index === existing.length - 1}
                  aria-label="Move photo down"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.media_icon_btn} ${styles.media_icon_btn_danger}`}
                  onClick={() => onDeleteExisting(image)}
                  aria-label="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}

          {pending.map((item, index) => (
            <li key={item.id} className={styles.media_item}>
              <div className={styles.media_thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="New photo preview" className={styles.media_preview} />
              </div>
              <div className={styles.media_actions}>
                <button
                  type="button"
                  className={styles.media_icon_btn}
                  onClick={() => movePending(item.id, -1)}
                  disabled={index === 0}
                  aria-label="Move photo up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className={styles.media_icon_btn}
                  onClick={() => movePending(item.id, 1)}
                  disabled={index === pending.length - 1}
                  aria-label="Move photo down"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.media_icon_btn} ${styles.media_icon_btn_danger}`}
                  onClick={() => removePending(item.id)}
                  aria-label="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {existing.length === 0 && pending.length === 0 && (
        <p className={styles.field_hint}>No photos yet — the first photo is shown as the cover.</p>
      )}
    </div>
  );
}