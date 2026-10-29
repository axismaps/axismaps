import { describe, test, expect, vi } from "vitest";
import { readImageSize } from "./image-size";

// Passes through to the real header read, so the tests below still measure
// the site's own files; one test overrides it to reach a branch no file in
// public/ currently exercises.
vi.mock("./image-size", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./image-size")>();
  return { ...actual, readImageSize: vi.fn(actual.readImageSize) };
});
import {
  allowedCardArtworkPath,
  defaultOgImage,
  fillsLargeCard,
  pageMetadata,
  publicImage,
  siteDescription,
  siteName,
  siteTitle,
  socialCardImage,
} from "./metadata";

describe("publicImage", () => {
  test("keeps the original file path and adds its dimensions", () => {
    // Not a /_next/image URL: social crawlers do not run the optimizer.
    expect(
      publicImage(
        "/images/projects/cpre-on-the-edge/01-national-overview.jpg",
        "On the Edge",
      ),
    ).toEqual({
      url: "/images/projects/cpre-on-the-edge/01-national-overview.jpg",
      alt: "On the Edge",
      width: 1600,
      height: 1000,
    });
  });

  test("still returns a usable image when the file cannot be measured", () => {
    expect(publicImage("/images/projects/gone.png", "Missing")).toEqual({
      url: "/images/projects/gone.png",
      alt: "Missing",
    });
  });
});

describe("pageMetadata", () => {
  test("gives a page its own Open Graph title, description and URL", () => {
    const metadata = pageMetadata({
      title: "On the Edge",
      description: "Mapping the pressure on England's green belt.",
      path: "/projects/cpre-on-the-edge",
    });

    expect(metadata.openGraph).toMatchObject({
      title: "On the Edge",
      description: "Mapping the pressure on England's green belt.",
      url: "/projects/cpre-on-the-edge",
      siteName,
      locale: "en_GB",
      alternateLocale: ["en_US"],
    });
  });

  test("asks for a large card and mirrors the Open Graph text on Twitter", () => {
    const metadata = pageMetadata({
      title: "On the Edge",
      description: "Mapping the pressure on England's green belt.",
      path: "/projects/cpre-on-the-edge",
      images: [{ url: "/one.jpg", alt: "One", width: 1600, height: 1000 }],
    });

    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "On the Edge",
      description: "Mapping the pressure on England's green belt.",
      images: [{ url: "/one.jpg", alt: "One", width: 1600, height: 1000 }],
    });
  });

  test("falls back to the generated card when a page has no image", () => {
    const metadata = pageMetadata({ title: "Projects", path: "/projects" });

    expect(metadata.openGraph?.images).toEqual([defaultOgImage]);
    expect(metadata.twitter?.images).toEqual([defaultOgImage]);
  });

  test("marks article pages as such and carries the publication date", () => {
    const metadata = pageMetadata({
      title: "On the Edge",
      path: "/projects/cpre-on-the-edge",
      type: "article",
      publishedTime: "2023-07-11",
    });

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2023-07-11",
    });
  });

  test("leaves the page title alone but still sets a social title", () => {
    const metadata = pageMetadata({ path: "/contact" });

    expect(metadata.title).toBeUndefined();
    expect(metadata.description).toBeUndefined();
    expect(metadata.openGraph).toMatchObject({
      title: siteTitle,
      description: siteDescription,
      url: "/contact",
    });
  });
});

describe("pageMetadata socialDescription", () => {
  test("prefers a card-specific line over the meta description", () => {
    const metadata = pageMetadata({
      title: "Typographic Maps",
      description: "The long version, written for a search result.",
      socialDescription: "The short version, written for a card.",
      path: "/typographic-maps",
    });

    expect(metadata.description).toBe(
      "The long version, written for a search result.",
    );
    expect(metadata.openGraph).toMatchObject({
      description: "The short version, written for a card.",
    });
    expect(metadata.twitter).toMatchObject({
      description: "The short version, written for a card.",
    });
  });
});

describe("fillsLargeCard", () => {
  test("accepts a picture at or above the 1200x630 card size", () => {
    expect(fillsLargeCard({ width: 1200, height: 630 })).toBe(true);
    expect(fillsLargeCard({ width: 1600, height: 1000 })).toBe(true);
  });

  test("rejects anything short of that in either direction", () => {
    expect(fillsLargeCard({ width: 1199, height: 900 })).toBe(false);
    expect(fillsLargeCard({ width: 1600, height: 629 })).toBe(false);
  });

  test("rejects a shape the card would have to crop hard", () => {
    // A near-square cover loses close to half its height to a 1.91:1 crop,
    // and a wide strip the same share of its width.
    expect(fillsLargeCard({ width: 1590, height: 1514 })).toBe(false);
    expect(fillsLargeCard({ width: 3200, height: 1000 })).toBe(false);
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
});

describe("socialCardImage", () => {
  test("names the file itself when it already fills a large card", () => {
    expect(
      socialCardImage(
        "/images/projects/cpre-on-the-edge/01-national-overview.jpg",
        "On the Edge",
      ),
    ).toEqual({
      url: "/images/projects/cpre-on-the-edge/01-national-overview.jpg",
      alt: "On the Edge",
      width: 1600,
      height: 1000,
    });
  });

  test("composites an undersized banner crop onto a 1200x630 card", () => {
    expect(
      socialCardImage("/images/projects/mapc-basemap-cover.png", "MAPC Basemap"),
    ).toEqual({
      url: "/og?image=%2Fimages%2Fprojects%2Fmapc-basemap-cover.png&title=MAPC+Basemap",
      width: 1200,
      height: 630,
      alt: "MAPC Basemap",
    });
  });

  test("composites a cover that is large but the wrong shape", () => {
    const image = socialCardImage(
      "/images/projects/hpi-cover.png",
      "Healthy Places Index",
    );

    expect(image.url).toBe(
      "/og?image=%2Fimages%2Fprojects%2Fhpi-cover.png&title=Healthy+Places+Index",
    );
    expect(image).toMatchObject({ width: 1200, height: 630 });
  });

  test("leaves a cover the path guard refuses to stand as it is", () => {
    // A filename with a space, or a WebP, fails the guard: /og could not
    // render it anyway, and the real artwork on a small card beats a card
    // with no artwork on it.
    vi.mocked(readImageSize).mockReturnValueOnce({ width: 800, height: 600 });

    expect(socialCardImage("/images/projects/a cover.png", "Spaced")).toEqual({
      url: "/images/projects/a cover.png",
      alt: "Spaced",
      width: 800,
      height: 600,
    });
  });

  test("leaves a file it cannot measure to stand as it is", () => {
    // An unmeasurable file is a missing or unrecognised one, and /og has
    // nothing to fetch for it either.
    expect(socialCardImage("/images/projects/gone.png", "Missing")).toEqual({
      url: "/images/projects/gone.png",
      alt: "Missing",
    });
  });
});
