// A project film hosted on Mux. `pnpm videos:sync` uploads each original in
// videos/ and writes a JSON sidecar beside it (videos/{slug}.mp4.json); the
// sidecar is next-video's Asset record, and it is all playback needs, so only
// the sidecars are committed. This module holds the parts the server (which
// reads sidecars) and the client (which plays them) both need.
import type { Asset } from "next-video/dist/assets.js";

export type VideoAsset = Asset;

// The film that leads a project's hero: a Mux asset, or a YouTube address
// from the project's videoUrl.
export type HeroVideo =
  | { source: "mux"; asset: VideoAsset }
  | { source: "embed"; url: string };

// Only a finished upload can play. Until then next-video would fall back to
// the original file, which is never deployed, so a sidecar that is still
// uploading or processing, or that failed, does not count.
export function isReadyMuxAsset(value: unknown): value is VideoAsset {
  if (!value || typeof value !== "object") return false;
  const asset = value as Partial<VideoAsset>;
  return (
    asset.status === "ready" &&
    (asset.provider ?? "mux") === "mux" &&
    typeof asset.providerMetadata?.mux?.playbackId === "string"
  );
}
