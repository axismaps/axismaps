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