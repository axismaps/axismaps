"use client";

import { useId, useState } from "react";
import DeepZoomViewer from "./DeepZoomViewer";
import PhotoGallery from "./PhotoGallery";
import type { Edition } from "./utils";

/**
 * An edition with its tile path already resolved to an absolute URL — null where
 * the edition is shown as photographs instead.
 */
export type ViewableEdition = Omit<Edition, "tilePath"> & {
  url: string | null;
};

type Props = {
  city: string;
  editions: ViewableEdition[];
};

/**
 * Deep-zoom viewer plus, where a city was redrawn or hand-printed, a switcher between
 * its editions. Each edition is its own tile pyramid, so switching remounts the viewer.
 */
export default function EditionViewer({ city, editions }: Props) {
  const hintId = useId();
  const initial = editions.findIndex((e) => e.primary);
  const [activeId, setActiveId] = useState(
    editions[initial >= 0 ? initial : 0]?.id,
  );

  if (!editions.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center">
        <p className="text-sm text-gray-700">
          The zoomable version of this map isn’t available yet.
        </p>
      </div>
    );
  }

  const active = editions.find((e) => e.id === activeId) ?? editions[0];

  return (
    <div>
      {/* A plain toggle-button group rather than role="tablist"/"tab". The ARIA tabs
          pattern also requires a linked tabpanel and arrow-key roving focus; a
          half-implemented version misleads screen readers more than no roles do. */}
      {editions.length > 1 && (
        <div
          role="group"
          aria-label={`${city} editions`}
          className="mb-3 flex flex-wrap gap-2"
        >
          {editions.map((edition) => {
            const selected = edition.id === active.id;
            return (
              <button
                key={edition.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveId(edition.id)}
                className={`rounded border px-4 py-2 text-sm transition-colors ${
                  selected
                    ? "border-transparent text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
                style={
                  selected
                    ? { backgroundColor: "var(--axismaps-blue)" }
                    : undefined
                }
              >
                {edition.label}
                <span className={selected ? "opacity-80" : "text-gray-500"}>
                  {" "}
                  · {edition.year}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {active.url ? (
        <DeepZoomViewer
          // Remount on edition change rather than swapping tile sources in place.
          key={active.id}
          dzi={active.url}
          orientation={active.orientation}
          label={
            editions.length > 1
              ? `Zoomable typographic map of ${city} — ${active.label}, ${active.year}`
              : `Zoomable typographic map of ${city}, ${active.year}`
          }
          describedById={hintId}
        />
      ) : (
        <PhotoGallery
          key={active.id}
          photos={active.photos}
          label={`${city} — ${active.label}`}
        />
      )}

      <p id={hintId} className="mt-2 text-xs text-gray-600">
        {active.url ? (
          <>
            Drag to pan, scroll or pinch to zoom. With the map focused, use the
            arrow keys to pan, <kbd>+</kbd> and <kbd>−</kbd> to zoom, and{" "}
            <kbd>0</kbd> to reset. Printed at {active.printSize}.
          </>
        ) : active.letterpress ? (
          <>
            Photographed from the original print — {active.printSize}. Hand-printed
            letterpress on 110 lb Crane’s Lettra cotton paper, in a signed and
            numbered edition of 50.
          </>
        ) : (
          // Every photo edition is a letterpress print today, but the caption above
          // asserts specifics (cotton stock, edition of 50) that only hold for those.
          <>Photographed from the original print — {active.printSize}.</>
        )}
      </p>
    </div>
  );
}
