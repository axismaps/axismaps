"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

interface ProjectGalleryProps {
  images: string[];
  title: string;
}

// Distance in px a touch has to travel before it counts as a swipe rather
// than a tap.
const SWIPE_THRESHOLD = 50;

export default function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) =>
      setCurrent((index) => (index + delta + images.length) % images.length),
    [images.length],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) > SWIPE_THRESHOLD) {
      go(distance < 0 ? 1 : -1);
    }
    touchStartX.current = null;
  }

  return (
    // tabIndex makes the arrow keys work once the gallery is focused, rather
    // than hijacking them from page scrolling.
    <div
      className="mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${title} screenshots`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        // Screenshots are captured at 16:10, so the frame matches them exactly
        // and object-contain only letterboxes for images of other proportions.
        className="relative w-full aspect-[16/10] max-h-[640px] rounded-lg overflow-hidden bg-gray-100"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt={`${title} — screenshot ${index + 1} of ${images.length}`}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            quality={85}
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            // object-contain so no part of a UI screenshot gets cropped away.
            className={`object-contain transition-opacity duration-300 ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={index !== current}
          />
        ))}

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/90 text-gray-700 shadow hover:bg-white hover:text-gray-900 transition-colors"
        >
          <span aria-hidden="true">←</span>
        </button>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/90 text-gray-700 shadow hover:bg-white hover:text-gray-900 transition-colors"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`Go to image ${index + 1}`}
            aria-current={index === current}
            className={`h-2 rounded-full transition-all ${
              index === current
                ? "w-6 bg-gray-800"
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Image {current + 1} of {images.length}
      </p>
    </div>
  );
}
