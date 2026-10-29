import { describe, test, expect } from "vitest";
import {
  defaultOgImage,
  pageMetadata,
  publicImage,
  siteDescription,
  siteName,
  siteTitle,
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
