// A project film hosted on Mux. `pnpm videos:sync` uploads each original in
// videos/ and writes a JSON sidecar beside it (videos/{slug}.mp4.json); the
// sidecar is next-video's Asset record, and it is all playback needs, so only
// the sidecars are committed. This module holds the parts the server (which
// reads sidecars) and the client (which plays them) both need.

// What playback needs from a sidecar, and nothing more: the rest of it (upload
// and asset ids, file size, the original's path) would only ride along in
// every page's payload. Typed here rather than imported from next-video,
// whose Asset type lives at an internal path.
export type VideoAsset = {
  status: "ready";
  provider: "mux";
  providerMetadata: { mux: { playbackId: string; thumbnailTime?: number } };
  blurDataURL?: string;
};

// The film that leads a project's hero: a Mux asset, or a YouTube or Vimeo
// address from the project's videoUrl.
export type HeroVideo =
  | { source: "mux"; asset: VideoAsset }
  | { source: "embed"; url: string };

type SidecarFields = {
  status?: unknown;
  provider?: unknown;
  providerMetadata?: { mux?: { playbackId?: unknown; thumbnailTime?: unknown } };
  blurDataURL?: unknown;
};

// Only a finished upload can play. Until then next-video would fall back to
// the original file, which is never deployed, so a sidecar that is still
// uploading or processing, or that failed, does not count.
export function isReadyMuxAsset(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const sidecar = value as SidecarFields;
  return (
    sidecar.status === "ready" &&
    (sidecar.provider ?? "mux") === "mux" &&
    typeof sidecar.providerMetadata?.mux?.playbackId === "string"
  );
}

// The playable part of a sidecar, or null when it is not a ready Mux upload.
export function toVideoAsset(value: unknown): VideoAsset | null {
  if (!isReadyMuxAsset(value)) return null;
  const sidecar = value as SidecarFields;
  const mux = sidecar.providerMetadata!.mux!;
  return {
    status: "ready",
    provider: "mux",
    providerMetadata: {
      mux: {
        playbackId: mux.playbackId as string,
        ...(typeof mux.thumbnailTime === "number"
          ? { thumbnailTime: mux.thumbnailTime }
          : {}),
      },
    },
    // Only an inline image: the poster puts it in a style attribute, so a
    // hand-edited sidecar shouldn't get arbitrary text in there.
    ...(typeof sidecar.blurDataURL === "string" &&
    sidecar.blurDataURL.startsWith("data:image/")
      ? { blurDataURL: sidecar.blurDataURL }
      : {}),
  };
}

// The film's poster frame, built the way next-video's player builds it (time,
// then width), so a poster shown before the player loads is the image the
// player then reuses from the browser cache rather than a second download.
export function muxPosterUrl(asset: VideoAsset, width?: number): string {
  const { playbackId, thumbnailTime } = asset.providerMetadata.mux;
  const query = new URLSearchParams();
  if (thumbnailTime != null) query.set("time", String(thumbnailTime));
  if (width) query.set("width", String(width));
  const search = query.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.webp${search ? `?${search}` : ""}`;
}

// The poster at the widths next-video's player asks for.
export function muxPosterSrcSet(asset: VideoAsset): string {
  return [480, 640, 960, 1280, 1600]
    .map((width) => `${muxPosterUrl(asset, width)} ${width}w`)
    .concat(`${muxPosterUrl(asset)} 1920w`)
    .join(",");
}
