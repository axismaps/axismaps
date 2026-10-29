import path from "path";
import type { Metadata } from "next";
import { readImageSize, type ImageSize } from "./image-size";

export const siteName = "Axis Maps";

export const siteTitle = "Axis Maps - Data-Driven Cartography";

export const siteDescription =
  "Axis Maps brings cartography to interactive mapping. We design custom maps that combine intuitive user interfaces with great cartographic and interactive design.";

// Next replaces the whole openGraph block when a page declares one rather than
// merging it with the root layout's, so the locale pair lives here and travels
// with every page that builds its metadata through pageMetadata.
export const ogLocale = "en_GB";
export const ogAlternateLocale = ["en_US"];

export type OgImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

// The generated card at /og already renders at the 1200x630 that LinkedIn and
// X want for a large preview, which makes it the fallback for pages with no
// picture of their own.
export const defaultOgImage: OgImage = {
  url: "/og",
  width: 1200,
  height: 630,
  alt: `${siteName} — data-driven cartography`,
};

// Social crawlers never run the image optimizer, so og:image has to name the
// original file under public/ rather than a /_next/image URL. The path stays
// site-relative here; metadataBase makes it absolute in the rendered tag.
export function publicImage(src: string, alt: string): OgImage {
  const size = readImageSize(path.join(process.cwd(), "public", src));
  return { url: src, alt, ...(size ?? {}) };
}

export type PageMetadataInput = {
  /** Omit to leave the root layout's site-wide title and description in place. */
  title?: string;
  description?: string;
  /** A shorter line for the card where the meta description reads long on one. */
  socialDescription?: string;
  /** Site-relative path of this page, e.g. "/projects/cpre-on-the-edge". */
  path: string;
  images?: OgImage[];
  type?: "website" | "article";
  publishedTime?: string;
};

// One shape for the social tags every page needs: a title and description of
// its own, its own canonical URL in og:url, and a large-format image.
export function pageMetadata({
  title,
  description,
  socialDescription,
  path: pathname,
  images,
  type = "website",
  publishedTime,
}: PageMetadataInput): Metadata {
  const resolvedImages = images?.length ? images : [defaultOgImage];
  const socialTitle = title ?? siteTitle;
  const cardDescription = socialDescription ?? description ?? siteDescription;

  const shared = {
    title: socialTitle,
    description: cardDescription,
    url: pathname,
    siteName,
    locale: ogLocale,
    alternateLocale: ogAlternateLocale,
    images: resolvedImages,
  };

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    openGraph:
      type === "article"
        ? {
            ...shared,
            type: "article",
            ...(publishedTime ? { publishedTime } : {}),
          }
        : { ...shared, type: "website" },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: cardDescription,
      images: resolvedImages,
    },
  };
}

// The size a large LinkedIn/X card is laid out for. Below it, those networks
// fall back to the small thumbnail-beside-text treatment.
export const largeCardWidth = 1200;
export const largeCardHeight = 630;

// A card is laid out at 1200x630, so anything appreciably taller or wider than
// that 1.91:1 frame gets centre-cropped to fit. A sixth of the picture is
// about as much as is worth losing; past that the crop takes the legend off a
// map or the title block off a poster, so the picture is better letterboxed on
// a card of our own than cropped in the feed.
const cardAspect = largeCardWidth / largeCardHeight;
const maxCropFraction = 1 / 6;
const minCardAspect = cardAspect * (1 - maxCropFraction);
const maxCardAspect = cardAspect / (1 - maxCropFraction);

// Whether a picture can carry a large preview on its own, rather than being
// composited onto a card first: big enough in both directions, and close
// enough in shape to survive the crop.
export function fillsLargeCard({ width, height }: ImageSize): boolean {
  if (width < largeCardWidth || height < largeCardHeight) {
    return false;
  }
  const aspect = width / height;
  return aspect >= minCardAspect && aspect <= maxCardAspect;
}

// Site-relative paths under /images/ only. The /og route turns this parameter
// into a fetch, so an absolute URL, a protocol-relative one or a traversal out
// of public/ must not get through; a path that fails this is simply ignored by
// the route, which falls back to its plain titled card.
export function allowedCardArtworkPath(raw: string | null): string | null {
  if (!raw || raw.includes("..")) {
    return null;
  }
  return /^\/images\/[\w.-]+(\/[\w.-]+)*\.(png|jpe?g|webp)$/i.test(raw)
    ? raw
    : null;
}

// The card image for a page: the artwork itself where it already fills a large
// card, and otherwise the same artwork composited onto one at /og. Either way
// the preview shows the real picture at the size the networks want.
//
// Like publicImage, this measures the file under public/, so it belongs in a
// generateMetadata that runs at build time. A page rendered from the
// serverless bundle, which excludes public/images, would measure nothing and
// quietly name the undersized file instead.
export function socialCardImage(src: string, title: string): OgImage {
  const size = readImageSize(path.join(process.cwd(), "public", src));

  // A file we cannot measure is a missing or unrecognised one, and /og would
  // only fail to fetch it, so the path is named as it stands either way.
  const needsCard = size !== null && !fillsLargeCard(size);

  if (!needsCard || !allowedCardArtworkPath(src)) {
    return { url: src, alt: title, ...(size ?? {}) };
  }

  const params = new URLSearchParams({ image: src, title });
  return {
    url: `/og?${params}`,
    width: largeCardWidth,
    height: largeCardHeight,
    alt: title,
  };
}
