import { baseUrl } from "../sitemap";

// Project artwork runs to a few megabytes at the top end. Past this the card
// is not worth the memory or the wait, and the plain titled card stands in.
const maxArtworkBytes = 8 * 1024 * 1024;

// A card nobody waits for is better than a request that hangs: a crawler gives
// og:image a few seconds at most before it gives up on the preview entirely.
const fetchTimeoutMs = 4000;

// What satori will actually draw. It renders neither WebP nor SVG, and failing
// that test it tears the response down mid-stream rather than raising anything
// the route could catch, so the bytes are checked here before they get near it
// — a content-type header is the server's word for it, this is the file's.
function isRenderable(bytes: Uint8Array): boolean {
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
  return isPng || isJpeg;
}

// Where the card's artwork is served from. Satori has no filesystem, and
// public/images is deliberately left out of the serverless bundle, so the
// picture comes back over HTTP. VERCEL_URL is this deployment's own hostname,
// set by the platform, which is what serves the images this build ships. The
// request's own Host is trusted only for the local dev server, since anywhere
// else it is the caller's to set and would make this route fetch someone
// else's /images/.
export function artworkOrigin(requestUrl: string): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const { origin, hostname } = new URL(requestUrl);
  return hostname === "localhost" || hostname === "127.0.0.1"
    ? origin
    : baseUrl;
}

// Satori will happily render a plate with nothing on it if the <img> it was
// given cannot be fetched, which makes a worse card than not trying at all, so
// the bytes are fetched here first and handed over inline. Anything that is
// not an image we can show — a 404, a deployment-protection challenge page, a
// timeout, something oversized — comes back as null, and the route falls back
// to its plain titled card.
export async function fetchArtwork(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });

    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) {
      return null;
    }

    // Declared length first, so an oversized file is dropped rather than read.
    const declared = Number(response.headers.get("content-length"));
    if (declared > maxArtworkBytes) {
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxArtworkBytes || !isRenderable(bytes)) {
      return null;
    }

    return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}
