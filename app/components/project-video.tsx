"use client";

import {
  Suspense,
  forwardRef,
  lazy,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentProps,
} from "react";
// A type-only import: it is erased, so the player itself still loads lazily.
import type NextVideo from "next-video";
import { videoEmbed } from "../lib/video-embed";
import {
  muxPosterSrcSet,
  type HeroVideo,
  type VideoAsset,
} from "../lib/video-asset";

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

type NextVideoAsset = Exclude<
  NonNullable<ComponentProps<typeof NextVideo>["src"]>,
  string
>;

// next-video's Asset also carries the original's path and timestamps, which
// it reads only for an upload that is not ready yet. A VideoAsset is always
// ready, so they are filled with blanks rather than shipped to the page.
function toNextVideoAsset(asset: VideoAsset): NextVideoAsset {
  return { ...asset, originalFilePath: "", createdAt: 0, updatedAt: 0 };
}

// The film's poster frame, held in place while the player's code loads, so
// the hero shows its picture at once rather than an empty box. It asks for the
// same images the player will, so the player finds them already cached.
export function MuxPoster({ asset }: { asset: VideoAsset }) {
  return (
    // A plain img: the frame comes from Mux's image service, which already
    // serves each width, and next/image would only proxy it.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://image.mux.com/${asset.providerMetadata.mux.playbackId}/thumbnail.webp${
        asset.providerMetadata.mux.thumbnailTime != null
          ? `?time=${asset.providerMetadata.mux.thumbnailTime}`
          : ""
      }`}
      srcSet={muxPosterSrcSet(asset)}
      sizes="(max-width: 1024px) 100vw, 1024px"
      alt=""
      aria-hidden="true"
      className="h-full w-full object-contain"
      style={
        asset.blurDataURL
          ? {
              backgroundImage: `url("${asset.blurDataURL}")`,
              backgroundSize: "cover",
            }
          : undefined
      }
    />
  );
}

// Whether a hero video will render anything: a Mux asset always does, and a
// videoUrl only when it is an address the embed knows how to play.
export function isPlayable(
  video: HeroVideo | null | undefined,
): video is HeroVideo {
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
          <Suspense fallback={<MuxPoster asset={video.asset} />}>
            <Video
              ref={media}
              src={toNextVideoAsset(video.asset)}
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
