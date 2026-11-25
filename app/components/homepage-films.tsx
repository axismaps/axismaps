"use client";

import { useEffect, useRef, useState } from "react";
import { FaPlay } from "react-icons/fa";
import ProjectVideo, { MuxPoster } from "./project-video";
import { muxPosterUrl } from "../lib/video-asset";
import type { HomepageFilm } from "../projects/utils";

// The homepage's film block: one large poster with a play button, and under
// it a picker of the films, which also names the one showing. Nothing of the
// player loads until play is pressed (ProjectVideo imports next-video lazily,
// and is only rendered then), so a visitor who never plays one pays for a few
// poster images and no more. Picking another film swaps the poster rather
// than starting it: a narrated film should only make sound when play is
// pressed.
export default function HomepageFilms({ films }: { films: HomepageFilm[] }) {
  // The picker stays in date order, so the lead film is wherever its date
  // puts it rather than first.
  const [selected, setSelected] = useState(() =>
    Math.max(
      0,
      films.findIndex((f) => f.lead),
    ),
  );
  const [playing, setPlaying] = useState(false);
  const player = useRef<HTMLDivElement>(null);

  // The play button is gone once the player mounts, so focus moves to the
  // player in its place rather than falling back to the top of the page.
  useEffect(() => {
    if (playing) player.current?.focus();
  }, [playing]);

  const film = films[selected];
  if (!film) return null;

  return (
    <div>
      {/* The box keeps its shape whichever is inside it, so nothing moves
          when the player takes the poster's place. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        {playing ? (
          <div
            ref={player}
            tabIndex={-1}
            className="h-full w-full focus:outline-none"
          >
            <ProjectVideo
              video={{ source: "mux", asset: film.asset }}
              title={film.title}
              muted={film.muted}
              autoPlay
            />
          </div>
        ) : (
          <>
            <MuxPoster key={film.slug} asset={film.asset} />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${film.title} video`}
              className="group absolute inset-0 grid place-items-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-500"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-transform group-hover:scale-110 group-focus-visible:scale-110">
                <FaPlay className="ml-1 h-6 w-6" aria-hidden="true" />
              </span>
            </button>
          </>
        )}
      </div>

      {films.length > 1 && (
        <div
          role="group"
          aria-label="Choose a film"
          className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
        >
          {films.map((option, index) => {
            const current = index === selected;
            return (
              <button
                key={option.slug}
                type="button"
                aria-pressed={current}
                onClick={() => {
                  if (current) return;
                  setSelected(index);
                  setPlaying(false);
                }}
                className={`min-w-0 overflow-hidden rounded-md border-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  current
                    ? "border-blue-600"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                {/* A plain img, as in MuxPoster: Mux serves the width asked for. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={muxPosterUrl(option.asset, 320)}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-full bg-gray-100 object-cover"
                />
                <span className="block truncate px-2 py-1.5 text-sm font-medium">
                  {option.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
