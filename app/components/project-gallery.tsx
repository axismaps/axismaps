"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { videoEmbed } from "../lib/video-embed";

interface ProjectGalleryProps {
  images: string[];
  title: string;
  // A video to lead the carousel, ahead of the screenshots.
  video?: string;
}

// Distance in px a touch has to travel before it counts as a swipe rather
// than a tap.
const SWIPE_THRESHOLD = 50;

export default function ProjectGallery({
  images,
  title,
  video,
}: ProjectGalleryProps) {
  const embed = useMemo(() => (video ? videoEmbed(video) : null), [video]);
  // The video, when there is one, is slide 0 and the screenshots follow it,
  // so a screenshot's slide index is one more than its place in `images`.
  const offset = embed ? 1 : 0;
  const count = images.length + offset;
  const [current, setCurrent] = useState(0);
  // Slides are mounted as they are reached, plus the one after. Marking an
  // unseen slide `loading="lazy"` would not defer anything, because every
  // slide shares the visible slide's box and so counts as near the viewport
  // — only leaving it unmounted actually avoids the download.
  const [mounted, setMounted] = useState<Set<number>>(
    () => new Set(count > 1 ? [0, 1] : [0]),
  );
  const touchStartX = useRef<number | null>(null);
  const videoFrame = useRef<HTMLIFrameElement>(null);
  const videoSlide = useRef<HTMLDivElement>(null);
  const showingVideo = embed !== null && current === 0;

  // Inert takes the hidden player out of clicks, keyboard focus and the
  // accessibility tree at once; tabIndex on the iframe would not reliably keep
  // Tab from reaching the controls inside its cross-origin frame. It is set on
  // the element because React versions disagree about the prop: the App
  // Router renders with its own React 19, which wants a boolean and reads ""
  // as false, while the tests run React 18, which drops a boolean.
  useEffect(() => {
    videoSlide.current?.toggleAttribute("inert", !showingVideo);
  }, [showingVideo]);

  // Mounting is updated alongside the index rather than in an effect. Doing it
  // after paint meant a jump to an unmounted slide — wrapping backwards, or a
  // distant dot — rendered one empty frame before the image appeared.
  const show = useCallback(
    (index: number) => {
      if (count === 0) return;
      // Leaving the video only hides it, so it is paused rather than left
      // playing out of sight. It stays mounted, so coming back to it picks
      // up where it stopped. A player that has not loaded yet ignores the
      // message, which is fine: it cannot be playing either.
      if (embed && current === 0 && index !== 0) {
        videoFrame.current?.contentWindow?.postMessage(
          embed.pauseMessage,
          embed.origin,
        );
      }
      setCurrent(index);
      setMounted((previous) => {
        const upcoming = (index + 1) % count;
        if (previous.has(index) && previous.has(upcoming)) return previous;
        const next = new Set(previous);
        next.add(index);
        next.add(upcoming);
        return next;
      });
    },
    [count, current, embed],
  );

  const go = useCallback(
    (delta: number) => show((current + delta + count) % count),
    [show, current, count],
  );

  // Once someone clicks into the video, focus is inside the player's
  // cross-origin frame and its key presses never reach this handler, so the
  // arrows drive the player rather than the carousel until focus comes back
  // out. The on-screen controls work throughout.
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

  // A tap on a nav button that drifts past the swipe threshold would otherwise
  // fire both the button's onClick and the swipe, advancing two slides.
  function stopTouch(event: React.TouchEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) > SWIPE_THRESHOLD) {
      go(distance < 0 ? 1 : -1);
    }
    touchStartX.current = null;
  }

  // The detail page only renders this with two or more images, but the
  // component should not depend on its caller repeating that check.
  if (count === 0) return null;

  const noun = embed ? "slide" : "image";

  return (
    // tabIndex makes the arrow keys work once the gallery is focused, rather
    // than hijacking them from page scrolling.
    <div
      className="mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
      role="group"
      aria-roledescription="carousel"
      aria-label={
        embed ? `${title} video and screenshots` : `${title} screenshots`
      }
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        // Screenshots are captured at 16:10, so the frame matches them exactly
        // and object-contain only letterboxes for images of other proportions.
        // A video takes its own 16:9 instead: the screenshots then letterbox
        // a little, which is less jarring than the frame changing shape
        // between slides.
        className={`relative w-full ${
          embed ? "aspect-video" : "aspect-[16/10]"
        } max-h-[640px] rounded-lg overflow-hidden bg-gray-100`}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
      >
        {embed && (
          <div
            ref={videoSlide}
            className={`absolute inset-0 transition-opacity duration-300 ${
              showingVideo ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!showingVideo}
          >
            <iframe
              ref={videoFrame}
              src={embed.src}
              title={`${title} video`}
              className="w-full h-full"
              allow={embed.allow}
              allowFullScreen
            ></iframe>
          </div>
        )}

        {images.map((src, position) => {
          const index = position + offset;
          return mounted.has(index) ? (
            <Image
              key={src}
              src={src}
              alt={`${title} — screenshot ${position + 1} of ${images.length}`}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              quality={85}
              priority={index === 0}
              // Hidden slides stay mounted for the cross-fade, so they must
              // not swallow clicks meant for the visible one.
              className={`object-contain transition-opacity duration-300 ${
                index === current
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={index !== current}
            />
          ) : null;
        })}

        <button
          type="button"
          onClick={() => go(-1)}
          onTouchStart={stopTouch}
          onTouchEnd={stopTouch}
          aria-label={`Previous ${noun}`}
          className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/90 text-gray-700 shadow hover:bg-white hover:text-gray-900 transition-colors"
        >
          <span aria-hidden="true">←</span>
        </button>

        <button
          type="button"
          onClick={() => go(1)}
          onTouchStart={stopTouch}
          onTouchEnd={stopTouch}
          aria-label={`Next ${noun}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/90 text-gray-700 shadow hover:bg-white hover:text-gray-900 transition-colors"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => show(index)}
            aria-label={
              index < offset
                ? "Go to video"
                : `Go to image ${index - offset + 1}`
            }
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
        {showingVideo
          ? "Video"
          : `Image ${current - offset + 1} of ${images.length}`}
      </p>
    </div>
  );
}
