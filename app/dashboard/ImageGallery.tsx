"use client";

import { useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StorageImage from "./StorageImage";
import styles from "./ImageGallery.module.css";

export type GalleryImage = {
  id: string;
  storage_path: string;
  position: number;
};

type ImageGalleryProps = {
  images: GalleryImage[];
  alt: string;
  /** "card" for the My Venues list card, "detail" for the venue detail page. */
  variant?: "card" | "detail";
  /**
   * Detail variant only: layer the prev/next arrows and position dots on
   * top of the image instead of in a bar below it. Opt-in so existing
   * detail galleries keep their current layout.
   */
  overlayControls?: boolean;
  sizes?: string;
};

/**
 * Main image plus client-side photo navigation.
 *
 * - `card` shows a thumbnail strip of the other photos; clicking one swaps it
 *   into the main display.
 * - `detail` shows prev/next controls and dots instead of a scrolling strip,
 *   so the big hero never depends on a scrollbar.
 *
 * Every control calls preventDefault() + stopPropagation() so that when the
 * gallery sits inside the list card's <Link>, a photo click never triggers
 * the card's navigation to the venue detail page.
 */
export default function ImageGallery({
  images,
  alt,
  variant = "card",
  overlayControls = false,
  sizes,
}: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);

  // Falls back to the first photo if the selected one was removed upstream.
  const activeIndex = Math.max(
    0,
    sorted.findIndex((image) => image.id === activeId),
  );
  const active = sorted[activeIndex] ?? null;

  if (!active) {
    return (
      <div className={`${styles.gallery} ${styles[variant]}`}>
        <div className={styles.empty}>No photo yet</div>
      </div>
    );
  }

  const total = sorted.length;
  // The strip always shows the photos *other than* the one on display.
  const thumbnails = sorted.filter((image) => image.id !== active.id);

  function handleSelect(event: MouseEvent<HTMLButtonElement>, imageId: string) {
    event.preventDefault();
    event.stopPropagation();
    setActiveId(imageId);
  }

  function step(event: MouseEvent<HTMLButtonElement>, delta: number) {
    event.preventDefault();
    event.stopPropagation();
    // Clamp at the ends instead of wrapping, so the arrows' disabled state
    // always reflects what a click would do.
    const nextIndex = Math.min(Math.max(activeIndex + delta, 0), total - 1);
    const next = sorted[nextIndex];
    if (next) setActiveId(next.id);
  }

  const controls =
    variant === "detail" && total > 1 ? (
      <>
        <button
          type="button"
          className={styles.nav_button}
          onClick={(event) => step(event, -1)}
          disabled={activeIndex === 0}
          aria-label="Previous photo"
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        <div className={styles.dots}>
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`${styles.dot} ${index === activeIndex ? styles.dot_active : ""}`}
              onClick={(event) => handleSelect(event, image.id)}
              aria-label={`Show photo ${index + 1} of ${total} for ${alt}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.nav_button}
          onClick={(event) => step(event, 1)}
          disabled={activeIndex === total - 1}
          aria-label="Next photo"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </>
    ) : null;

  return (
    <div className={`${styles.gallery} ${styles[variant]}`}>
      <div className={styles.main}>
        {variant === "detail" ? (
          // Detail galleries stack every photo and toggle
          // visibility. All images load up front — through
          // next/image, sized via `sizes`, so no full-
          // resolution original is ever pulled — and a slide
          // change is a pure class toggle with no network
          // round-trip (previously only the active slide was
          // rendered, so every click cold-fetched the next
          // optimized image through the image optimizer).
          // Keys keep each photo's <img> mounted, so React
          // never re-renders or re-fetches a loaded photo.
          sorted.map((image, index) => (
            <StorageImage
              key={image.id}
              storagePath={image.storage_path}
              alt={alt}
              sizes={sizes ?? "(max-width: 900px) 92vw, 360px"}
              className={`${styles.main_image} ${
                index === activeIndex ? styles.main_image_active : ""
              }`}
              priority={index === 0}
            />
          ))
        ) : (
          <StorageImage
            storagePath={active.storage_path}
            alt={alt}
            sizes={sizes ?? "(max-width: 900px) 92vw, 360px"}
            className={styles.main_image}
          />
        )}

        {controls && overlayControls ? (
          <div className={styles.overlay}>{controls}</div>
        ) : null}
      </div>

      {controls && !overlayControls ? <div className={styles.controls}>{controls}</div> : null}

      {variant === "card" &&
        thumbnails.length > 0 && (
          <div className={styles.strip}>
            {thumbnails.map((image) => (
              <button
                key={image.id}
                type="button"
                className={styles.thumb}
                onClick={(event) => handleSelect(event, image.id)}
                aria-label={`Show photo ${sorted.indexOf(image) + 1} of ${total} for ${alt}`}
              >
                <StorageImage
                  storagePath={image.storage_path}
                  alt={`${alt} photo`}
                  sizes="88px"
                  className={styles.thumb_image}
                />
              </button>
            ))}
          </div>
        )}
    </div>
  );
}
