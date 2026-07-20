"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo } from "./utils";

type Props = {
  photos: Photo[];
  /** Used to build the alt text, e.g. "Manhattan — Letterpress edition — black". */
  label: string;
};

/**
 * Photo gallery for editions shown as photographs rather than zoomable tiles.
 *
 * The letterpress prints are the reason this exists: their appeal is the debossed
 * type and the cotton stock, neither of which survives being rendered from vector.
 */
export default function PhotoGallery({ photos, label }: Props) {
  const [active, setActive] = useState(0);

  if (!photos.length) return null;

  const lead = photos[active];

  return (
    <div>
      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <Image
          src={lead.src}
          alt={`${label} — photograph ${active + 1} of ${photos.length}`}
          // Real measured dimensions, not an assumed ratio — these shots vary by a
          // pixel or two and a future edition could differ meaningfully.
          width={lead.width}
          height={lead.height}
          sizes="(max-width: 976px) 100vw, 976px"
          priority={active === 0}
          className="h-auto w-full"
        />
      </div>

      {photos.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photograph ${i + 1} of ${photos.length}`}
              aria-current={i === active}
              className={`overflow-hidden rounded border transition-colors ${
                i === active
                  ? "border-gray-500"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image
                src={photo.src}
                alt=""
                width={160}
                height={107}
                sizes="120px"
                className="h-16 w-24 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
