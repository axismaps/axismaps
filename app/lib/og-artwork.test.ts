import { afterEach, describe, expect, test, vi } from "vitest";
import {
  allowedCardArtworkPath,
  artworkOrigins,
  fetchArtwork,
  maxArtworkBytes,
} from "./og-artwork";

const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);


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

describe("artworkOrigins", () => {
  test("tries this deployment first, then the production domain", () => {
    // The deployment serves the images this build ships; the production
    // domain is the host deployment protection cannot take away.
    vi.stubEnv("VERCEL_URL", "axismaps-abc123.vercel.app");

    expect(
      artworkOrigins("https://www.axismaps.com/og?image=/images/a.png"),
    ).toEqual([
      "https://axismaps-abc123.vercel.app",
      "https://www.axismaps.com",
    ]);
  });

  test("uses the dev server's own origin when running locally", () => {
    vi.stubEnv("VERCEL_URL", "");

    expect(artworkOrigins("http://localhost:3000/og")).toEqual([
      "http://localhost:3000",
      "https://www.axismaps.com",
    ]);
  });

  test("ignores a Host it does not recognise, which the caller sets", () => {
    vi.stubEnv("VERCEL_URL", "");

    expect(artworkOrigins("https://attacker.example/og")).toEqual([
      "https://www.axismaps.com",
    ]);
  });

  test("reads nothing from the request where the platform tells us the host", () => {
    // request.url is built from the Host header, so a deployment that took
    // the hint could be asked to fetch http://localhost/images/.
    vi.stubEnv("VERCEL_URL", "axismaps-abc123.vercel.app");

    expect(artworkOrigins("http://localhost/og")).toEqual([
      "https://axismaps-abc123.vercel.app",
      "https://www.axismaps.com",
    ]);
  });
});

describe("fetchArtwork", () => {
  test("returns the bytes inline so satori never fetches them itself", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));

    expect(await fetchArtwork(["https://example.test"], "/images/a.png")).toBe(
      `data:image/png;base64,${Buffer.from(pngBytes).toString("base64")}`,
    );
  });

  test("gives up on a file that is not there", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(pngBytes, { status: 404 })),
    );

    expect(await fetchArtwork(["https://example.test"], "/images/gone.png")).toBeNull();
  });

  test("gives up on anything that is not an image", async () => {
    // A deployment-protection challenge answers 200 with an HTML page, and
    // the body is what settles it: the header could say anything.
    const html = new TextEncoder().encode("<!doctype html><title>Sign in");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(html, { type: "image/png" })),
    );

    expect(await fetchArtwork(["https://example.test"], "/images/a.png")).toBeNull();
  });

  test("gives up on a file too big to be worth a card", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        imageResponse(pngBytes, { length: String(64 * 1024 * 1024) }),
      ),
    );

    expect(await fetchArtwork(["https://example.test"], "/images/huge.png")).toBeNull();
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

    expect(await fetchArtwork(["https://example.test"], "/images/a.png")).toBeNull();
  });

  test("gives up on an empty body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(new Uint8Array())),
    );

    expect(await fetchArtwork(["https://example.test"], "/images/a.png")).toBeNull();
  });

  test("takes a file that is exactly at the cap", async () => {
    const atCap = new Uint8Array(maxArtworkBytes);
    atCap.set(pngBytes);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse(atCap)));

    expect(
      await fetchArtwork(["https://example.test"], "/images/big.png"),
    ).toContain("data:image/png;base64,");
  });

  test("still catches an oversized file that declared no length", async () => {
    const huge = new Uint8Array(maxArtworkBytes + 1);
    huge.set(pngBytes);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse(huge)));

    expect(await fetchArtwork(["https://example.test"], "/images/huge.png")).toBeNull();
  });

  test("falls back to the next host when the first does not answer", async () => {
    // A deployment behind protection answers its own fetch with a challenge;
    // the production domain is still there to serve the file.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(imageResponse(pngBytes, { status: 401 }))
      .mockResolvedValueOnce(imageResponse());
    vi.stubGlobal("fetch", fetchMock);

    expect(
      await fetchArtwork(
        ["https://deployment.test", "https://www.axismaps.com"],
        "/images/a.png",
      ),
    ).toContain("data:image/png;base64,");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://www.axismaps.com/images/a.png",
      expect.anything(),
    );
  });

  test("spends one deadline across the hosts, not one each", async () => {
    // Two hosts at four seconds apiece would be eight, which is longer than
    // a crawler waits for a picture.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(imageResponse(pngBytes, { status: 500 }))
      .mockResolvedValueOnce(imageResponse());
    vi.stubGlobal("fetch", fetchMock);

    await fetchArtwork(["https://one.test", "https://two.test"], "/images/a.png");

    const [first, second] = fetchMock.mock.calls;
    expect(first[1].signal).toBe(second[1].signal);
  });

  test("gives up when the request fails or times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timed out")));

    expect(await fetchArtwork(["https://example.test"], "/images/a.png")).toBeNull();
  });
});

describe("allowedCardArtworkPath", () => {
  test("accepts a site-relative path to an image under /images/", () => {
    expect(allowedCardArtworkPath("/images/projects/hpi-cover.png")).toBe(
      "/images/projects/hpi-cover.png",
    );
    expect(
      allowedCardArtworkPath("/images/blog/a-post/cover.JPEG"),
    ).toBe("/images/blog/a-post/cover.JPEG");
  });

  test("refuses anything that would fetch from somewhere else", () => {
    expect(allowedCardArtworkPath(null)).toBeNull();
    expect(allowedCardArtworkPath("https://example.com/x.png")).toBeNull();
    expect(allowedCardArtworkPath("//example.com/x.png")).toBeNull();
    expect(allowedCardArtworkPath("/images/../../secrets/x.png")).toBeNull();
    expect(allowedCardArtworkPath("/public/x.png")).toBeNull();
    expect(allowedCardArtworkPath("/images/x.svg")).toBeNull();
    // satori renders neither, and a WebP takes the response down with it.
    expect(allowedCardArtworkPath("/images/x.webp")).toBeNull();
    expect(allowedCardArtworkPath("/images/x.png?w=1")).toBeNull();
    expect(allowedCardArtworkPath("/images\\..\\x.png")).toBeNull();
    // searchParams hands the route a decoded path, so an encoded traversal
    // arrives as the plain one above; the raw form is refused as well.
    expect(allowedCardArtworkPath("/images/%2e%2e/x.png")).toBeNull();
  });

  test("accepts two dots inside a filename, which climb out of nothing", () => {
    expect(allowedCardArtworkPath("/images/projects/survey..final.png")).toBe(
      "/images/projects/survey..final.png",
    );
  });
});
