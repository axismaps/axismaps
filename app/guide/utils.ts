import path from "path";
import { getMDXData } from "../lib/mdx";
import { formatDate as formatDateBase } from "../lib/date";
import {
  getContentBySlug,
  getContentByCategory,
  type ContentItem
} from "../lib/content";
import { loadDataFile } from "../lib/data-loader";

export type GuideMetadata = {
  title: string;
  slug: string;
  order?: number;
  publishedAt: string;
  category?: string;
  categorySlug?: string;
  summary?: string;
};

export type GuideCategory = {
  name: string;
  slug: string;
  order: number;
};

export type Guide = ContentItem<GuideMetadata>;

export function getGuides(): Guide[] {
  const guides = getMDXData<GuideMetadata>(
    path.join(process.cwd(), "app", "guide", "posts"),
  );

  // Sort by order if available, otherwise by title
  return guides.sort((a, b) => {
    if (a.metadata.order && b.metadata.order) {
      return a.metadata.order - b.metadata.order;
    }
    return a.metadata.title.localeCompare(b.metadata.title);
  });
}

export function getGuideBySlug(slug: string): Guide | undefined {
  const guides = getGuides();
  return getContentBySlug(guides, slug);
}

export function getGuidesByCategory(categorySlug: string): Guide[] {
  const guides = getGuides();
  return getContentByCategory(guides, categorySlug, "categorySlug");
}

// Load category data
export function getGuideCategories(): Record<string, GuideCategory> {
  return loadDataFile("data", "guide-categories.json", {});
}

// Get guides organized by category
export function getGuidesGroupedByCategory() {
  const guides = getGuides().filter(guide => guide.slug !== 'resources'); // Filter out resources page
  const categories = getGuideCategories();

  const grouped: Record<string, {
    category: GuideCategory;
    guides: Guide[];
  }> = {};

  // Initialize all categories
  Object.values(categories).forEach((category) => {
    grouped[category.slug] = {
      category,
      guides: [],
    };
  });

  // Add guides to their categories (they're already sorted by order)
  guides.forEach((guide) => {
    const categorySlug = guide.metadata.categorySlug;
    if (categorySlug && grouped[categorySlug]) {
      grouped[categorySlug].guides.push(guide);
    }
  });

  // Sort by category order and filter out empty categories
  return Object.values(grouped)
    .filter(group => group.guides.length > 0)
    .sort((a, b) => a.category.order - b.category.order);
}

export function formatDate(date: string): string {
  return formatDateBase(date);
}

// Search-related helper functions
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm) return text;

  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

export function extractSearchSnippet(
  content: string,
  searchTerm: string,
  maxLength: number = 150
): string {
  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const termIndex = lowerContent.indexOf(lowerTerm);

  if (termIndex === -1) {
    return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
  }

  const start = Math.max(0, termIndex - 50);
  const end = Math.min(content.length, termIndex + maxLength);

  let snippet = content.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

export function getAllGuideCategoriesForSearch() {
  const categories = getGuideCategories();
  return Object.values(categories).sort((a, b) => a.order - b.order);
}