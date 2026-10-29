import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchArtwork = vi.fn();

// The artwork fetch is mocked out: what matters here is which card the route
// chooses, not satori's rendering, which has its own cost and no bearing on
// the branch under test.
vi.mock("../lib/og-artwork", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/og-artwork")>();
  return { ...actual, fetchArtwork };
});

const { GET } = await import("./route");

// A real 1x1 PNG: satori has to decode whatever it is handed, and a stub of
// the right first few bytes takes the response down with it.
const dataUrl =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAA" +
  "DUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function card(query: string) {
  return GET(new Request(`https://www.axismaps.com/og?${query}`));
}

// The two cards are different pictures, so their bytes differ: enough to tell
// which branch rendered without pinning the test to a byte count that every
// change to the layout would break.
async function bodySize(response: Response): Promise<number> {
  return (await response.arrayBuffer()).byteLength;
}

beforeEach(() => {
  fetchArtwork.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /og", () => {
  test("returns a 1200x630 PNG for the plain titled card", async () => {
    const response = await card("title=Guide+Chapter");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(fetchArtwork).not.toHaveBeenCalled();
    // Nothing went wrong, so the card keeps next/og's own long cache.
    expect(response.headers.get("cache-control")).toContain("immutable");
  });

  test("composites the artwork named by a site-relative path", async () => {
    fetchArtwork.mockResolvedValue(dataUrl);

    const composited = await card(
      "image=%2Fimages%2Fprojects%2Fhpi-cover.png&title=HPI",
    );
    fetchArtwork.mockResolvedValue(null);
    const plain = await card("title=HPI");

    expect(composited.status).toBe(200);
    expect(fetchArtwork).toHaveBeenCalledWith(
      expect.arrayContaining(["https://www.axismaps.com"]),
      "/images/projects/hpi-cover.png",
    );
    // The artwork branch really rendered, rather than quietly falling through
    // to the plain card, which would otherwise pass every assertion above.
    expect(await bodySize(composited)).not.toBe(await bodySize(plain));
  });

  test("never fetches an image parameter pointing somewhere else", async () => {
    const response = await card("image=https%3A%2F%2Fexample.com%2Fx.png");

    expect(response.status).toBe(200);
    expect(fetchArtwork).not.toHaveBeenCalled();
  });

  test("falls back to the plain card when the artwork cannot be had", async () => {
    // Rather than the empty plate satori draws for an <img> it cannot load.
    fetchArtwork.mockResolvedValue(null);

    const response = await card("image=%2Fimages%2Fprojects%2Fgone.png");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    // And it is not cached for a year, so one bad minute does not stick.
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=60, s-maxage=60",
    );
  });
});
