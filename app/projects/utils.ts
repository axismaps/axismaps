import fs from "fs";
import path from "path";
import { getMDXData } from "../lib/mdx";
import { formatDate as formatDateBase } from "../lib/date";
import {
  getContentBySlug,
  getContentByCategory,
  getFeaturedContent,
  type ContentItem,
} from "../lib/content";
import { loadDataFile } from "../lib/data-loader";
import { videoEmbed } from "../lib/video-embed";
import {
  isReadyMuxAsset,
  toVideoAsset,
  type HeroVideo,
  type VideoAsset,
} from "../lib/video-asset";

export type ProjectMetadata = {
  title: string;
  slug: string;
  publishedAt: string;
  featured?: boolean;
  subtitle?: string;
  teaser?: string;
  client?: string;
  clientSlug?: string;
  category?: string;
  categorySlug?: string;
  coverImage?: string;
  videoUrl?: string;
  // true when the video's audio is only a music soundtrack, so it starts
  // muted; a narrated video leaves this out and plays with sound
  videoMuted?: boolean;
  mapUrl?: string;
  githubUrl?: string;
  launchDate?: string;
};

export type Project = ContentItem<ProjectMetadata>;

export function getProjects(): Project[] {
  const projects = getMDXData<ProjectMetadata>(
    path.join(process.cwd(), "app", "projects", "posts"),
  );

  // Sort by launch date (or published date as fallback)
  return projects.sort((a, b) => {
    const dateA = a.metadata.launchDate || a.metadata.publishedAt;
    const dateB = b.metadata.launchDate || b.metadata.publishedAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

export function getProjectBySlug(slug: string): Project | undefined {
  const projects = getProjects();
  return getContentBySlug(projects, slug);
}

export function getProjectsByCategory(categorySlug: string): Project[] {
  const projects = getProjects();
  return getContentByCategory(projects, categorySlug, "categorySlug");
}

export function getProjectsByClient(clientSlug: string): Project[] {
  const projects = getProjects();
  return projects.filter(
    (project) => project.metadata.clientSlug === clientSlug,
  );
}

export function getFeaturedProjects(): Project[] {
  const projects = getProjects();
  return getFeaturedContent(projects, "featured");
}

const GALLERY_IMAGE_PATTERN = /\.(png|jpe?g|webp|avif)$/i;

// Gallery images live in public/images/projects/{slug}/ and are ordered by
// filename, so prefix them: 01-overview.png, 02-compare-mode.png, and so on.
// Most projects have no such directory, in which case the detail page falls
// back to coverImage.
export function getProjectGallery(slug: string): string[] {
  const galleryRoot = path.join(process.cwd(), "public", "images", "projects");
  const galleryDir = path.resolve(galleryRoot, slug);

  // Slugs come from MDX filenames rather than user input, but this should not
  // read outside the projects image directory on any caller's behalf.
  if (!galleryDir.startsWith(galleryRoot + path.sep)) {
    return [];
  }

  if (!fs.existsSync(galleryDir)) {
    return [];
  }

  try {
    return (
      fs
        .readdirSync(galleryDir)
        .filter((file) => GALLERY_IMAGE_PATTERN.test(file))
        // Numeric collation so a tenth image sorts after the second rather
        // than after the first, as a plain lexicographic sort would have it.
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((file) => `/images/projects/${slug}/${file}`)
    );
  } catch (error) {
    console.error(`Error reading gallery directory ${galleryDir}:`, error);
    return [];
  }
}

// Original extensions a sidecar may carry. Mux reads all of them, so an
// original keeps its own format rather than being re-encoded first.
const VIDEO_EXTENSIONS = ["mp4", "mov", "m4v", "webm"];

// A project's Mux film, found by convention: the sidecar that
// `pnpm videos:sync` writes at videos/{slug}.{ext}.json once the original at
// videos/{slug}.{ext} is uploaded. Returns null when there is no ready
// sidecar, so a project keeps its videoUrl embed (if any) until its upload has
// finished processing. A sidecar that is unreadable or not ready yet is passed
// over for the next extension; videos.test.ts fails CI on either, and on a
// project with more than one.
export function getProjectVideoAsset(slug: string): VideoAsset | null {
  const videoRoot = path.resolve(process.cwd(), "videos");

  for (const extension of VIDEO_EXTENSIONS) {
    const sidecar = path.resolve(videoRoot, `${slug}.${extension}.json`);

    // As with the gallery: slugs come from MDX filenames, but this should not
    // read outside the videos directory on any caller's behalf.
    if (!sidecar.startsWith(videoRoot + path.sep)) {
      return null;
    }

    if (!fs.existsSync(sidecar)) {
      continue;
    }

    try {
      const asset = toVideoAsset(JSON.parse(fs.readFileSync(sidecar, "utf-8")));
      if (asset) return asset;
      // Said out loud, since a Vercel build doesn't run videos.test.ts: a
      // committed sidecar that isn't ready leaves its project with no film.
      console.warn(
        `Video sidecar ${sidecar} is not a ready Mux upload; run \`pnpm videos:sync\`.`,
      );
    } catch (error) {
      console.error(`Error reading video sidecar ${sidecar}:`, error);
    }
  }

  return null;
}

export type ProjectHero =
  | { kind: "video"; video: HeroVideo; images: string[] }
  | { kind: "gallery"; images: string[] }
  | { kind: "image"; src: string }
  | { kind: "none" };

// Hero precedence for a project detail page, in one place so it is legible
// and testable rather than buried in a nested ternary:
//   1. a video, leading a carousel of the gallery once there are enough
//      images to page through: the project's Mux film if its upload is ready,
//      otherwise a videoUrl that can be embedded. A videoUrl that cannot be
//      embedded is passed over, not left as a blank
//   2. the gallery, once there are enough images to page through
//   3. a single still — the lone gallery image if that is all there is,
//      otherwise coverImage
// coverImage therefore no longer reaches the hero on a project with a
// gallery, though it still drives the index and related-project cards.
// The Mux asset is passed in (see getProjectVideoAsset) so that this stays a
// pure function of what it is given.
export function resolveProjectHero(
  metadata: Pick<ProjectMetadata, "videoUrl" | "coverImage">,
  gallery: string[],
  asset: VideoAsset | null = null,
): ProjectHero {
  // getProjectVideoAsset only returns ready assets, but this function is
  // public (the homepage may hand it assets from elsewhere), so it checks
  // readiness itself rather than trusting the type.
  const video: HeroVideo | null =
    asset && isReadyMuxAsset(asset)
      ? { source: "mux", asset }
      : metadata.videoUrl && videoEmbed(metadata.videoUrl)
        ? { source: "embed", url: metadata.videoUrl }
        : null;

  if (video) {
    // A lone still adds little after a video, so it is left out rather than
    // turning the video into a two-slide carousel.
    return {
      kind: "video",
      video,
      images: gallery.length > 1 ? gallery : [],
    };
  }

  if (gallery.length > 1) {
    return { kind: "gallery", images: gallery };
  }

  const still = gallery[0] ?? metadata.coverImage;
  return still ? { kind: "image", src: still } : { kind: "none" };
}

// Type definitions for client and category data
export type Category = {
  name: string;
  slug: string;
};

export type Client = {
  name: string;
  slug: string;
};

// Load client and category data
export function getClients(): Record<string, Client> {
  return loadDataFile("data", "clients.json", {});
}

export function getCategories(): Record<string, Category> {
  return loadDataFile("data", "categories.json", {});
}

export function formatDate(date: string, includeRelative = false): string {
  // Ensure date has time component for consistency
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  return formatDateBase(date, { includeRelative });
}
