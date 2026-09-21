import { createClient } from "@/utils/supabase/client";

export const IMAGE_BUCKET = "venue-media";

/** Reasonable per-image size cap for venue/pitch photos. */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Absolute public URL for a stored object (public bucket, no auth needed). */
export function storagePublicUrl(storagePath: string): string {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}`;
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/${encoded}`;
}

/** Build the storage path convention required by the bucket's RLS policy:
 *  venue images → venue-media/{venueId}/venue/{filename}
 *  pitch images → venue-media/{venueId}/pitches/{pitchId}/{filename} */
export function venueImagePath(venueId: string, fileName: string): string {
  return `${venueId}/venue/${uniqueFileName(fileName)}`;
}

export function pitchImagePath(
  venueId: string,
  pitchId: string,
  fileName: string,
): string {
  return `${venueId}/pitches/${pitchId}/${uniqueFileName(fileName)}`;
}

function uniqueFileName(fileName: string): string {
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
  return `${crypto.randomUUID()}-${sanitized}`;
}

export type InventoryClient = ReturnType<typeof createClient>;

/** Upload one file into the venue-media bucket. Returns the storage path. */
export async function uploadToBucket(
  supabase: InventoryClient,
  storagePath: string,
  file: File,
): Promise<{ ok: true; storagePath: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, storagePath: data.path };
}

/** Remove a stored object from the bucket. */
export async function removeFromBucket(
  supabase: InventoryClient,
  storagePath: string,
): Promise<boolean> {
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
  return !error;
}