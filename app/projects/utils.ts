import fs from "fs";
import path from "path";
import { getMDXData } from "../lib/mdx";
import { formatDate as formatDateBase } from "../lib/date";
import {
  getContentBySlug,
  getContentByCategory,
  getFeaturedContent,
  type ContentItem
} from "../lib/content";
import { loadDataFile } from "../lib/data-loader";

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

export type ProjectHero =
  | { kind: "video"; url: string }
  | { kind: "gallery"; images: string[] }
  | { kind: "image"; src: string }
  | { kind: "none" };

// Hero precedence for a project detail page, in one place so it is legible
// and testable rather than buried in a nested ternary:
//   1. a video, if the project has one
//   2. the gallery, once there are enough images to page through
//   3. a single still — the lone gallery image if that is all there is,
//      otherwise coverImage
// coverImage therefore no longer reaches the hero on a project with a
// gallery, though it still drives the index and related-project cards.
export function resolveProjectHero(
  metadata: Pick<ProjectMetadata, "videoUrl" | "coverImage">,
  gallery: string[],
): ProjectHero {
  if (metadata.videoUrl) {
    return { kind: "video", url: metadata.videoUrl };
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