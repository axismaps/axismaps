import { baseUrl } from "./site";

// Everything the /og card needs to know about its artwork: which paths it will
// accept, where the file is served from, and what satori can be handed. None
// of it touches the filesystem, so the route stays a small bundle.

// The size a large LinkedIn/X card is laid out for. Below it, those networks
// fall back to the small thumbnail-beside-text treatment.
export const largeCardWidth = 1200;
export const largeCardHeight = 630;

// Project artwork runs to a few megabytes at the top end. Past this the card
// is not worth the memory or the wait, and the plain titled card stands in.
export const maxArtworkBytes = 8 * 1024 * 1024;

// A card nobody waits for is better than a request that hangs: a crawler gives
// og:image a few seconds at most before it gives up on the preview entirely.
const fetchTimeoutMs = 4000;

// Site-relative paths under /images/ only. The /og route turns this parameter
// into a fetch, so an absolute URL, a protocol-relative one or a traversal out
// of public/ must not get through; a path that fails this is simply ignored by
// the route, which falls back to its plain titled card.
//
// PNG and JPEG only: satori renders neither WebP nor SVG, and handing it one
// does not raise an error the route can catch — it tears down the response
// mid-stream, leaving the crawler with nothing at all. A WebP cover keeps its
// own undersized card instead, which at least still shows the artwork.
export function allowedCardArtworkPath(raw: string | null): string | null {
  // A whole segment, not the two characters anywhere: a cover genuinely named
  // "survey..final.png" climbs out of nothing and should keep its card.
  if (!raw || raw.split("/").includes("..")) {
    return null;
  }
  return /^\/images\/[\w.-]+(\/[\w.-]+)*\.(png|jpe?g)$/i.test(raw)
    ? raw
    : null;
}

// Where to look for the artwork, in order. Satori has no filesystem, and
// public/images is deliberately left out of the serverless bundle, so the
// picture comes back over HTTP.
//
// This deployment comes first: it is the only host serving the images this
// build ships, so a change to a cover composites the new file rather than the
// one already live. The production domain follows as the fallback, because it
// is the one host that cannot be shut off by deployment protection — which, if
// it were ever switched on, would otherwise leave every card self-fetching a
// 401 and quietly losing its artwork.
//
// Nothing from the request is trusted where the platform can tell us who we
// are: request.url is built from the Host header, so a deployment that read it
// could be asked to fetch http://localhost/images/. Off Vercel there is no
// VERCEL_URL to go on, and only a local dev server's own origin is taken.
export function artworkOrigins(requestUrl: string): string[] {
  if (process.env.VERCEL_URL) {
    return dedupe([`https://${process.env.VERCEL_URL}`, baseUrl]);
  }

  const { origin, hostname } = new URL(requestUrl);
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  return local ? dedupe([origin, baseUrl]) : [baseUrl];
}

function dedupe(origins: string[]): string[] {
  return origins.filter((origin, index) => origins.indexOf(origin) === index);
}

// What satori will actually draw, read from the file rather than taken from a
// content-type header, which is only the server's word for it.
function renderableType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg";
  }
  return null;
}

async function fetchFrom(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });

    if (!response.ok) {
      return null;
    }

    // Declared length first, so an oversized file is dropped rather than read.
    if (Number(response.headers.get("content-length")) > maxArtworkBytes) {
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxArtworkBytes) {
      return null;
    }

    const type = renderableType(bytes);
    return type
      ? `data:${type};base64,${Buffer.from(bytes).toString("base64")}`
      : null;
  } catch {
    return null;
  }
}

// Satori will happily render a plate with nothing on it if the <img> it was
// given cannot be fetched, which makes a worse card than not trying at all, so
// the bytes are fetched here first and handed over inline. A host that does
// not answer with a picture we can draw falls through to the next one, and
// when none of them does the caller gets null and shows its plain titled card.
export async function fetchArtwork(
  origins: string[],
  path: string,
): Promise<string | null> {
  for (const origin of origins) {
    const artwork = await fetchFrom(`${origin}${path}`);
    if (artwork) {
      return artwork;
    }
  }
  return null;
}
