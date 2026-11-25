"use client";

import {
  Suspense,
  forwardRef,
  lazy,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { videoEmbed } from "../lib/video-embed";
import type { HeroVideo } from "../lib/video-asset";

export type ProjectVideoHandle = {
  // Stop playback, for a carousel moving off the video's slide: the slide is
  // only hidden, so an unpaused film would keep playing out of sight.
  pause(): void;
};

interface ProjectVideoProps {
  video: HeroVideo;
  title: string;
  // Start with the sound off, for a film whose audio is only a music
  // soundtrack. The viewer can still unmute it from the player.
  muted?: boolean;
}

// The player and its theme are most of this component's weight, and every
// project page carries this component, film or not. Loading them lazily keeps
// them off the pages that have only screenshots or a YouTube embed.
const Video = lazy(() => import("next-video"));

// Whether a hero video will render anything: a Mux asset always does, and a
// videoUrl only when it is an address the embed knows how to play.
export function isPlayable(video: HeroVideo | null | undefined): boolean {
  if (!video) return false;
  return video.source === "mux" || videoEmbed(video.url) !== null;
}

// A project's film, filling the box it is placed in: a Mux asset through
// next-video's player, or a YouTube embed. Both are paused the same way, so a
// carousel need not know which it holds.
const ProjectVideo = forwardRef<ProjectVideoHandle, ProjectVideoProps>(
  function ProjectVideo({ video, title, muted = false }, ref) {
    const media = useRef<HTMLVideoElement>(null);
    const frame = useRef<HTMLIFrameElement>(null);
    const embedUrl = video.source === "embed" ? video.url : null;
    const embed = useMemo(
      () => (embedUrl ? videoEmbed(embedUrl, { muted }) : null),
      [embedUrl, muted],
    );

    useImperativeHandle(
      ref,
      () => ({
        pause() {
          if (embed) {
            // A cross-origin player only takes commands by message. One that
            // has not loaded yet ignores it, which is fine: it cannot be
            // playing either.
            frame.current?.contentWindow?.postMessage(
              embed.pauseMessage,
              embed.origin,
            );
          } else {
            media.current?.pause();
          }
        },
      }),
      [embed],
    );

    if (video.source === "mux") {
      return (
        // The player's own controls are labelled, but the film itself has no
        // name without this; an embed's iframe carries it in its title.
        <div
          role="group"
          aria-label={`${title} video`}
          className="h-full w-full"
        >
          <Suspense fallback={null}>
            <Video
              ref={media}
              src={video.asset}
              muted={muted}
              playsInline
              className="h-full"
            />
          </Suspense>
        </div>
      );
    }

    if (!embed) return null;

    return (
      <iframe
        ref={frame}
        src={embed.src}
        title={`${title} video`}
        className="w-full h-full"
        allow={embed.allow}
        allowFullScreen
      ></iframe>
    );
  },
);

export default ProjectVideo;
