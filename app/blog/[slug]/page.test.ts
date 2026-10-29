import { describe, test, expect } from "vitest";
import { generateMetadata } from "./page";
import { getBlogPosts } from "../utils";
import { fillsLargeCard } from "../../lib/metadata";
import { largeCardHeight, largeCardWidth } from "../../lib/og-artwork";

type Card = { url: string; width?: number; height?: number };

async function cardFor(slug: string): Promise<Card> {
  const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
  const images = metadata.openGraph?.images as Card[] | undefined;
  // Said out loud rather than asserted away: a post that lost its card image
  // should fail naming the post, not with a TypeError from the subscript.
  expect(images?.[0], `${slug} has no card image`).toBeDefined();
  return images![0];
}

describe("blog post card images", () => {
  // The path guard in og-artwork refuses anything /og could not render — a space
  // in the filename, a WebP — and socialCardImage then falls back to naming the
  // small file. So does a cover it cannot measure. Either way the post quietly
  // keeps the undersized preview this wiring exists to replace, which is the
  // kind of regression a new post could introduce without anyone noticing.
  test("every cover either fills a large card or is composited onto one", async () => {
    const posts = getBlogPosts();
    expect(posts.length).toBeGreaterThan(0);

    for (const post of posts) {
      const cover = post.metadata.coverImage;
      expect(cover, `${post.slug} has no cover`).toBeTruthy();

      const card = await cardFor(post.slug);

      if (card.url === cover) {
        // Left alone, so the file itself has to be card-sized already.
        expect(
          fillsLargeCard({ width: card.width!, height: card.height! }),
          `${post.slug} named its own file`,
        ).toBe(true);
      } else {
        // Read back as parameters rather than as one string: a title carrying a
        // character the two encoders disagree about, such as the exclamation
        // mark in "Relief mapping in 10 easy steps!", would otherwise fail a
        // comparison the route itself is perfectly happy with.
        const params = new URL(card.url, "https://www.axismaps.com").searchParams;
        expect(params.get("image"), `${post.slug} card artwork`).toBe(cover);
        expect(params.get("title"), `${post.slug} card title`).toBe(
          post.metadata.title,
        );
        expect(card.width, `${post.slug} card width`).toBe(largeCardWidth);
        expect(card.height, `${post.slug} card height`).toBe(largeCardHeight);
      }
    }
  });

  test("composites the 750x150 strip rather than shipping it as the card", async () => {
    const card = await cardFor("the-aesthetician-and-the-cartographer");

    expect(card.url).toBe(
      "/og?image=%2Fimages%2Fblog%2Fthe-aesthetician-and-the-cartographer-cover.jpg" +
        "&title=The+Aesthetician+and+the+Cartographer",
    );
  });

  test("names the file itself when a cover already fills a card", async () => {
    const card = await cardFor("contour-maps-in-a-web-browser");

    expect(card.url).toBe("/images/blog/contour-maps-in-a-web-browser-cover.jpg");
    expect(card).toMatchObject({ width: 1299, height: 713 });
  });
});
