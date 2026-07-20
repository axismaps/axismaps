"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaPlus, FaMinus, FaExpand, FaCompress } from "react-icons/fa";
import { FaArrowsRotate } from "react-icons/fa6";

type Props = {
  /** Absolute URL of the .dzi manifest. */
  dzi: string;
  /** Static preview shown before the viewer initialises and to no-JS visitors. */
  previewSrc?: string;
  /** Describes the artwork for screen readers. */
  label: string;
  /** Id of an element describing how to use the viewer. */
  describedById?: string;
  /** Drives the viewport height — portrait maps need a taller frame to read well. */
  orientation?: "portrait" | "landscape";
};

const CONTROL_CLASSES =
  "flex h-9 w-9 items-center justify-center rounded border border-gray-300 bg-white/95 text-gray-700 shadow-sm transition-colors hover:border-gray-400 hover:bg-white hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40";

/**
 * Deep-zoom viewer for the typographic maps.
 *
 * OpenSeadragon is loaded inside the effect rather than at module scope: it touches
 * `document` when it is evaluated, so importing it eagerly would break server rendering.
 * That deferral is also why this component does not need `next/dynamic` — and it must not
 * use it, since `ssr: false` is a build error when a Server Component renders the wrapper.
 */
export default function DeepZoomViewer({
  dzi,
  previewSrc,
  label,
  describedById,
  orientation = "landscape",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<import("openseadragon").Viewer | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Guards against React StrictMode's double-mount: the first effect's cleanup
    // sets this before the dynamic import resolves, so only the surviving effect
    // ever constructs a viewer.
    let cancelled = false;
    let viewer: import("openseadragon").Viewer | null = null;

    import("openseadragon")
      .then(({ default: OpenSeadragon }) => {
        if (cancelled || !containerRef.current) return;
        viewer = OpenSeadragon({
          element: containerRef.current,
          tileSources: dzi,
          crossOriginPolicy: "Anonymous",
          ajaxWithCredentials: false,
          // OpenSeadragon's stock controls are sprite PNGs that don't match the
          // site. We render our own buttons as siblings and drive the viewport
          // directly, so no sprite sheet is loaded at all.
          showNavigationControl: false,
          showNavigator: true,
          navigatorPosition: "BOTTOM_RIGHT",
          navigatorHeight: 96,
          navigatorWidth: 96,
          navigatorBackground: "#ffffff",
          navigatorBorderColor: "#d1d5db",
          navigatorDisplayRegionColor: "var(--axismaps-blue)",
          navigatorSizeRatio: 0.15,
          // Never upscale past the tiles we publish — beyond 1:1 the viewer would
          // just show a blurry magnification of the deepest level.
          maxZoomPixelRatio: 1,
          // Leave visibilityRatio/constrainDuringPan at their defaults. Forcing the
          // image to cover the viewport clamps the minimum zoom, which means a
          // portrait map in a landscape frame can never be seen whole.
          minZoomImageRatio: 0.9,
          animationTime: 0.6,
          springStiffness: 7,
          gestureSettingsTouch: { pinchToZoom: true, flickEnabled: true },
        });
        viewerRef.current = viewer;
        viewer.addHandler("open", () => {
          if (cancelled) return;
          setReady(true);
          // The container is still being laid out when the viewer opens, so the
          // home framing OSD computes at that moment can be off-centre. Recompute
          // it once the layout has settled.
          requestAnimationFrame(() => {
            if (!cancelled) viewer?.viewport?.goHome(true);
          });
        });
        viewer.addHandler("open-failed", () => !cancelled && setFailed(true));
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      viewer?.destroy();
      viewerRef.current = null;
    };
  }, [dzi]);

  // Track fullscreen changes made outside our button (Esc, F11, browser UI).
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const viewport = viewerRef.current?.viewport;
    if (!viewport) return;
    viewport.zoomBy(factor);
    viewport.applyConstraints();
  }, []);

  const reset = useCallback(() => viewerRef.current?.viewport?.goHome(), []);

  // Fullscreen the whole frame rather than using OpenSeadragon's own full-page
  // mode, which reparents the canvas and would leave these controls behind.
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else frameRef.current?.requestFullscreen?.();
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
    >
      <div
        ref={containerRef}
        // role="img" rather than "application": the latter drops screen readers out of
        // browse mode, which makes the region harder to navigate, not easier.
        role="img"
        aria-label={label}
        aria-describedby={describedById}
        tabIndex={0}
        // Heights track the artwork's aspect ratio so a fitted map doesn't sit in a
        // band of empty space — most noticeable for landscape maps on narrow screens.
        // In fullscreen the frame owns the viewport, so the fixed heights step aside.
        className={`w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${
          isFullscreen
            ? "h-screen"
            : orientation === "portrait"
              ? "h-[70vh] min-h-[420px] sm:h-[85vh] sm:min-h-[520px]"
              : "h-[40vh] min-h-[260px] sm:h-[60vh] sm:min-h-[380px]"
        }`}
        style={{ ["--tw-ring-color" as string]: "var(--axismaps-blue)" }}
      />

      {ready && (
        <div
          className="absolute left-3 top-3 flex flex-col gap-1.5"
          style={{ ["--tw-ring-color" as string]: "var(--axismaps-blue)" }}
        >
          <button
            type="button"
            onClick={() => zoomBy(1.6)}
            className={CONTROL_CLASSES}
            aria-label="Zoom in"
          >
            <FaPlus className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.6)}
            className={CONTROL_CLASSES}
            aria-label="Zoom out"
          >
            <FaMinus className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={reset}
            className={CONTROL_CLASSES}
            aria-label="Reset view"
          >
            <FaArrowsRotate className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={CONTROL_CLASSES}
            aria-label={isFullscreen ? "Exit full screen" : "View full screen"}
          >
            {isFullscreen ? (
              <FaCompress className="h-3 w-3" aria-hidden="true" />
            ) : (
              <FaExpand className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
        </div>
      )}

      {/* Preview sits above the canvas until the first tiles are painted, so the page
          has a meaningful LCP element instead of an empty grey box. */}
      {previewSrc && !ready && !failed && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={previewSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain p-4"
        />
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-gray-700">
            This map couldn’t be loaded.{" "}
            <a href="/contact" className="link-primary underline">
              Let us know
            </a>{" "}
            if the problem persists.
          </p>
        </div>
      )}
    </div>
  );
}
