import { afterEach, describe, expect, test, vi } from "vitest";
import { artworkOrigin, fetchArtwork } from "./og-artwork";

const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Mirrors the module's own cap; a body past it is dropped either way.
const maxBytesForTest = 8 * 1024 * 1024;

function imageResponse(
  body: Uint8Array = pngBytes,
  init: { status?: number; type?: string; length?: string } = {},
) {
  const headers = new Headers({ "content-type": init.type ?? "image/png" });
  if (init.length) {
    headers.set("content-length", init.length);
  }
  return new Response(body, { status: init.status ?? 200, headers });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("artworkOrigin", () => {
  test("serves the artwork from the deployment running the request", () => {
    vi.stubEnv("VERCEL_URL", "axismaps-abc123.vercel.app");

    expect(artworkOrigin("https://www.axismaps.com/og?image=/images/a.png")).toBe(
      "https://axismaps-abc123.vercel.app",
    );
  });

  test("uses the dev server's own origin when running locally", () => {
    vi.stubEnv("VERCEL_URL", "");

    expect(artworkOrigin("http://localhost:3000/og")).toBe(
      "http://localhost:3000",
    );
  });

  test("ignores a Host it does not recognise, which the caller sets", () => {
    vi.stubEnv("VERCEL_URL", "");

    expect(artworkOrigin("https://attacker.example/og")).toBe(
      "https://www.axismaps.com",
    );
  });
});

describe("fetchArtwork", () => {
  test("returns the bytes inline so satori never fetches them itself", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));

    expect(await fetchArtwork("https://example.test/images/a.png")).toBe(
      `data:image/png;base64,${Buffer.from(pngBytes).toString("base64")}`,
    );
  });

  test("gives up on a file that is not there", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(pngBytes, { status: 404 })),
    );

    expect(await fetchArtwork("https://example.test/images/gone.png")).toBeNull();
  });

  test("gives up on anything that is not an image", async () => {
    // A deployment-protection challenge answers 200 with an HTML page.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(pngBytes, { type: "text/html" })),
    );

    expect(await fetchArtwork("https://example.test/images/a.png")).toBeNull();
  });

  test("gives up on a file too big to be worth a card", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        imageResponse(pngBytes, { length: String(64 * 1024 * 1024) }),
      ),
    );

    expect(await fetchArtwork("https://example.test/images/huge.png")).toBeNull();
  });

  test("gives up on a format satori cannot draw, whatever the header says", async () => {
    // A WebP does not raise an error satori can hand back; it tears the
    // response down mid-stream, so it must not reach the renderer.
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(webpBytes, { type: "image/png" })),
    );

    expect(await fetchArtwork("https://example.test/images/a.png")).toBeNull();
  });

  test("gives up on an empty body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(new Uint8Array())),
    );

    expect(await fetchArtwork("https://example.test/images/a.png")).toBeNull();
  });

  test("still catches an oversized file that declared no length", async () => {
    const huge = new Uint8Array(maxBytesForTest + 1);
    huge.set(pngBytes);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse(huge)));

    expect(await fetchArtwork("https://example.test/images/huge.png")).toBeNull();
  });

  test("gives up when the request fails or times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timed out")));

    expect(await fetchArtwork("https://example.test/images/a.png")).toBeNull();
  });
});
