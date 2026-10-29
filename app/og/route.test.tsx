import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fetchArtwork = vi.fn();

// The artwork fetch is mocked out: what matters here is which card the route
// chooses, not satori's rendering, which has its own cost and no bearing on
// the branch under test.
vi.mock("../lib/og-artwork", () => ({
  fetchArtwork,
  artworkOrigin: () => "https://www.axismaps.com",
}));

const { GET } = await import("./route");

const dataUrl = `data:image/png;base64,${Buffer.from([
  0x89, 0x50, 0x4e, 0x47,
]).toString("base64")}`;

function card(query: string) {
  return GET(new Request(`https://www.axismaps.com/og?${query}`));
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
  });

  test("composites the artwork named by a site-relative path", async () => {
    fetchArtwork.mockResolvedValue(dataUrl);

    const response = await card(
      "image=%2Fimages%2Fprojects%2Fhpi-cover.png&title=HPI",
    );

    expect(response.status).toBe(200);
    expect(fetchArtwork).toHaveBeenCalledWith(
      "https://www.axismaps.com/images/projects/hpi-cover.png",
    );
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
  });
});
