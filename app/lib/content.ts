export interface ContentItem<T extends Record<string, any>> {
  metadata: T;
  slug: string;
  content: string;
}

export function getContentBySlug<T extends Record<string, any>>(
  items: ContentItem<T>[],
  slug: string
): ContentItem<T> | undefined {
  return items.find((item) => item.slug === slug);
}

export function getContentByCategory<T extends Record<string, any>>(
  items: ContentItem<T>[],
  categorySlug: string,
  categoryField: keyof T = "categorySlug" as keyof T
): ContentItem<T>[] {
  return items.filter((item) => item.metadata[categoryField] === categorySlug);
}

export function getRelatedContent<T extends Record<string, any>>(
  items: ContentItem<T>[],
  currentSlug: string,
  categoryField: keyof T,
  limit: number = 3
): ContentItem<T>[] {
  const currentItem = getContentBySlug(items, currentSlug);
  if (!currentItem) return [];

  return items
    .filter(
      (item) =>
        item.slug !== currentSlug &&
        item.metadata[categoryField] === currentItem.metadata[categoryField]
    )
    .slice(0, limit);
}

export function getFeaturedContent<T extends Record<string, any>>(
  items: ContentItem<T>[],
  featuredField: keyof T = "featured" as keyof T
): ContentItem<T>[] {
  return items.filter((item) => item.metadata[featuredField] === true);
}