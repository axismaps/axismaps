import path from "path";
import type { Metadata } from "next";
import { readImageSize } from "./image-size";

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
