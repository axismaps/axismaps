import path from "path";
import { getMDXData } from "../lib/mdx";
import { getContentBySlug, type ContentItem } from "../lib/content";
import { loadDataFile } from "../lib/data-loader";

export type TypographicMapMetadata = {
  title: string;
  slug: string;
  publishedAt: string;
  city: string;
  teaser?: string;
  printSizes?: string;
};

export type TypographicMap = ContentItem<TypographicMapMetadata>;

export type Edition = {
  id: string;
  label: string;
  year: number;
  orientation: "portrait" | "landscape";
  printSize: string;
  letterpress: boolean;
  primary: boolean;
  /**
   * Path to the .dzi manifest, relative to NEXT_PUBLIC_TILE_BASE_URL.
   * Null for photo editions, and while an edition has no readable source artwork.
   */
  tilePath: string | null;
  /**
   * Public paths to photographs of the physical print. Used instead of tiles where
   * a photograph carries what a vector render can't — the letterpress editions.
   */
  photos: string[];
};

export type PressItem = {
  outlet: string;
  title: string;
  date: string;
  url: string;
  quote?: string;
  featured?: boolean;
  note?: string;
};

export function getTypographicMaps(): TypographicMap[] {
  const maps = getMDXData<TypographicMapMetadata>(
    path.join(process.cwd(), "app", "typographic-maps", "posts"),
  );

  // Alphabetical by city — this is a gallery, not a feed, and there is no
  // meaningful recency ordering across maps made between 2009 and 2022.
  return maps.sort((a, b) => a.metadata.city.localeCompare(b.metadata.city));
}

export function getTypographicMapBySlug(
  slug: string,
): TypographicMap | undefined {
  return getContentBySlug(getTypographicMaps(), slug);
}

function getAllEditions(): Record<string, Edition[]> {
  return loadDataFile("data", "typographic-editions.json", {});
}

export function getEditions(slug: string): Edition[] {
  return getAllEditions()[slug] ?? [];
}

/** Editions that can actually be shown — either as zoomable tiles or as photographs. */
export function getViewableEditions(slug: string): Edition[] {
  return getEditions(slug).filter(
    (edition) => edition.tilePath || edition.photos?.length,
  );
}

export function getPress(): PressItem[] {
  return loadDataFile("data", "typographic-press.json", [] as PressItem[]);
}

export function getFeaturedPress(): PressItem[] {
  return getPress().filter((item) => item.featured);
}

/** Absolute URL for a tile manifest, or null if tiles aren't configured/built. */
export function tileUrl(tilePath: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_TILE_BASE_URL;
  if (!base || !tilePath) return null;
  return `${base.replace(/\/$/, "")}/${tilePath}`;
}
