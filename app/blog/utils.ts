import path from "path";
import { getMDXData } from "../lib/mdx";
import { formatDate as formatDateBase } from "../lib/date";
import { getContentBySlug, type ContentItem } from "../lib/content";

export type BlogMetadata = {
  title: string;
  slug: string;
  publishedAt: string;
  author?: string;
  authorName?: string;
  summary?: string;
  coverImage?: string;
  category?: string;
  categorySlug?: string;
};

export type Blog = ContentItem<BlogMetadata>;

export function getBlogPosts(): Blog[] {
  const posts = getMDXData<BlogMetadata>(
    path.join(process.cwd(), "app", "blog", "posts"),
  );

  // Sort by published date (newest first)
  return posts.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime(),
  );
}

export function getBlogPostBySlug(slug: string): Blog | undefined {
  const posts = getBlogPosts();
  return getContentBySlug(posts, slug);
}

export function formatDate(date: string, includeRelative = false): string {
  // Ensure date has time component for consistency
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  return formatDateBase(date, { includeRelative });
}
