import fs from "fs";
import path from "path";

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

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match![1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const frontMatterLines = frontMatterBlock.trim().split("\n");
  const metadata: Partial<GuideMetadata> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(": ");
    let value = valueArr.join(": ").trim();
    value = value.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes

    const trimmedKey = key.trim() as keyof GuideMetadata;
    // Convert order to number
    if (trimmedKey === 'order') {
      (metadata as any)[trimmedKey] = parseInt(value, 10);
    } else {
      (metadata as any)[trimmedKey] = value;
    }
  });

  return { metadata: metadata as GuideMetadata, content };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter(rawContent);
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

export function getGuides() {
  const guides = getMDXData(
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

export function getGuideBySlug(slug: string) {
  const guides = getGuides();
  return guides.find((guide) => guide.slug === slug);
}

export function getGuidesByCategory(categorySlug: string) {
  const guides = getGuides();
  return guides.filter(
    (guide) => guide.metadata.categorySlug === categorySlug,
  );
}

// Load category data
export function getGuideCategories(): Record<string, GuideCategory> {
  const categoriesPath = path.join(process.cwd(), "data", "guide-categories.json");
  if (fs.existsSync(categoriesPath)) {
    return JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
  }
  return {};
}

// Get guides organized by category
export function getGuidesGroupedByCategory() {
  const guides = getGuides().filter(guide => guide.slug !== 'resources'); // Filter out resources page
  const categories = getGuideCategories();

  const grouped: Record<string, {
    category: GuideCategory;
    guides: typeof guides;
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

export function formatDate(date: string) {
  const targetDate = new Date(date);
  return targetDate.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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