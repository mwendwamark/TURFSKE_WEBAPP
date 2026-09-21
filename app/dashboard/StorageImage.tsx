"use client";

import { useState } from "react";
import Image from "next/image";
import { storagePublicUrl } from "@/utils/supabase/images";

type StorageImageProps = {
  storagePath: string;
  alt: string;
  sizes: string;
  className?: string;
};

export default function StorageImage({ storagePath, alt, sizes, className = "" }: StorageImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        role="img"
        aria-label={alt}
        style={{
          background: "var(--off-white)",
          border: "1px solid #e0e0e0",
        }}
      />
    );
  }

  return (
    <Image
      src={storagePublicUrl(storagePath)}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}