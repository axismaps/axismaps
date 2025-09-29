import { describe, it, expect } from 'vitest';
import {
  ContentItem,
  getContentBySlug,
  getContentByCategory,
  getRelatedContent,
  getFeaturedContent,
} from './content';

// Sample content type for testing
interface TestMetadata {
  title: string;
  categorySlug?: string;
  featured?: boolean;
  type?: string;
  order?: number;
}

describe('Content Utilities', () => {
  // Sample data for testing
  const sampleContent: ContentItem<TestMetadata>[] = [
    {
      slug: 'post-1',
      metadata: { title: 'Post 1', categorySlug: 'tech', featured: true },
      content: 'Content for post 1',
    },
    {
      slug: 'post-2',
      metadata: { title: 'Post 2', categorySlug: 'tech', featured: false },
      content: 'Content for post 2',
    },
    {
      slug: 'post-3',
      metadata: { title: 'Post 3', categorySlug: 'design', featured: true },
      content: 'Content for post 3',
    },
    {
      slug: 'post-4',
      metadata: { title: 'Post 4', categorySlug: 'design', featured: false },
      content: 'Content for post 4',
    },
    {
      slug: 'post-5',
      metadata: { title: 'Post 5', categorySlug: 'tech', featured: false },
      content: 'Content for post 5',
    },
  ];

  describe('getContentBySlug', () => {
    it('should return content item matching the slug', () => {
      const result = getContentBySlug(sampleContent, 'post-2');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('post-2');
      expect(result?.metadata.title).toBe('Post 2');
      expect(result?.content).toBe('Content for post 2');
    });

    it('should return undefined for non-existent slug', () => {
      const result = getContentBySlug(sampleContent, 'non-existent');
      expect(result).toBeUndefined();
    });

    it('should handle empty array', () => {
      const result = getContentBySlug([], 'any-slug');
      expect(result).toBeUndefined();
    });

    it('should handle case-sensitive slugs', () => {
      const result = getContentBySlug(sampleContent, 'Post-1');
      expect(result).toBeUndefined(); // Should not match 'post-1'
    });
  });

  describe('getContentByCategory', () => {
    it('should return all items from specified category', () => {
      const result = getContentByCategory(sampleContent, 'tech');

      expect(result).toHaveLength(3);
      expect(result.map(item => item.slug)).toEqual(['post-1', 'post-2', 'post-5']);
    });

    it('should return empty array for non-existent category', () => {
      const result = getContentByCategory(sampleContent, 'non-existent');
      expect(result).toEqual([]);
    });

    it('should use custom category field', () => {
      const customContent: ContentItem<{ title: string; type: string }>[] = [
        { slug: 'a', metadata: { title: 'A', type: 'blog' }, content: 'A' },
        { slug: 'b', metadata: { title: 'B', type: 'article' }, content: 'B' },
        { slug: 'c', metadata: { title: 'C', type: 'blog' }, content: 'C' },
      ];

      const result = getContentByCategory(customContent, 'blog', 'type');
      expect(result).toHaveLength(2);
      expect(result.map(item => item.slug)).toEqual(['a', 'c']);
    });

    it('should handle missing category field in metadata', () => {
      const incompleteContent: ContentItem<TestMetadata>[] = [
        { slug: 'no-category', metadata: { title: 'No Category' }, content: 'Content' },
      ];

      const result = getContentByCategory(incompleteContent, 'tech');
      expect(result).toEqual([]);
    });

    it('should handle empty array', () => {
      const result = getContentByCategory([], 'any-category');
      expect(result).toEqual([]);
    });
  });

  describe('getRelatedContent', () => {
    it('should return related content from same category', () => {
      const result = getRelatedContent(sampleContent, 'post-1', 'categorySlug');

      expect(result).toHaveLength(2);
      expect(result.map(item => item.slug)).toEqual(['post-2', 'post-5']);
      // Should not include the current item (post-1)
      expect(result.every(item => item.slug !== 'post-1')).toBe(true);
    });

    it('should respect the limit parameter', () => {
      const result = getRelatedContent(sampleContent, 'post-1', 'categorySlug', 1);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('post-2');
    });

    it('should use default limit of 3', () => {
      // Add more items to test default limit
      const extendedContent = [
        ...sampleContent,
        { slug: 'post-6', metadata: { title: 'Post 6', categorySlug: 'tech' }, content: 'Content 6' },
        { slug: 'post-7', metadata: { title: 'Post 7', categorySlug: 'tech' }, content: 'Content 7' },
      ];

      const result = getRelatedContent(extendedContent, 'post-1', 'categorySlug');
      expect(result).toHaveLength(3);
    });

    it('should return empty array for non-existent slug', () => {
      const result = getRelatedContent(sampleContent, 'non-existent', 'categorySlug');
      expect(result).toEqual([]);
    });

    it('should return empty array when no related content exists', () => {
      const isolatedContent: ContentItem<TestMetadata>[] = [
        { slug: 'isolated', metadata: { title: 'Isolated', categorySlug: 'unique' }, content: 'Content' },
      ];

      const result = getRelatedContent(isolatedContent, 'isolated', 'categorySlug');
      expect(result).toEqual([]);
    });

    it('should handle missing category in current item', () => {
      const mixedContent: ContentItem<TestMetadata>[] = [
        { slug: 'no-cat', metadata: { title: 'No Category' }, content: 'Content' },
        { slug: 'with-cat', metadata: { title: 'With Category', categorySlug: 'tech' }, content: 'Content' },
      ];

      const result = getRelatedContent(mixedContent, 'no-cat', 'categorySlug');
      expect(result).toEqual([]);
    });

    it('should work with different category fields', () => {
      const customContent: ContentItem<{ title: string; type: string }>[] = [
        { slug: 'a', metadata: { title: 'A', type: 'blog' }, content: 'A' },
        { slug: 'b', metadata: { title: 'B', type: 'blog' }, content: 'B' },
        { slug: 'c', metadata: { title: 'C', type: 'article' }, content: 'C' },
      ];

      const result = getRelatedContent(customContent, 'a', 'type');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('b');
    });
  });

  describe('getFeaturedContent', () => {
    it('should return only featured items', () => {
      const result = getFeaturedContent(sampleContent);

      expect(result).toHaveLength(2);
      expect(result.map(item => item.slug)).toEqual(['post-1', 'post-3']);
      expect(result.every(item => item.metadata.featured === true)).toBe(true);
    });

    it('should use custom featured field', () => {
      const customContent: ContentItem<{ title: string; highlighted?: boolean }>[] = [
        { slug: 'a', metadata: { title: 'A', highlighted: true }, content: 'A' },
        { slug: 'b', metadata: { title: 'B', highlighted: false }, content: 'B' },
        { slug: 'c', metadata: { title: 'C', highlighted: true }, content: 'C' },
      ];

      const result = getFeaturedContent(customContent, 'highlighted');
      expect(result).toHaveLength(2);
      expect(result.map(item => item.slug)).toEqual(['a', 'c']);
    });

    it('should return empty array when no featured items', () => {
      const nonFeaturedContent: ContentItem<TestMetadata>[] = [
        { slug: 'post-a', metadata: { title: 'Post A', featured: false }, content: 'Content A' },
        { slug: 'post-b', metadata: { title: 'Post B', featured: false }, content: 'Content B' },
      ];

      const result = getFeaturedContent(nonFeaturedContent);
      expect(result).toEqual([]);
    });

    it('should handle missing featured field', () => {
      const incompleteContent: ContentItem<TestMetadata>[] = [
        { slug: 'no-featured', metadata: { title: 'No Featured Field' }, content: 'Content' },
      ];

      const result = getFeaturedContent(incompleteContent);
      expect(result).toEqual([]);
    });

    it('should handle empty array', () => {
      const result = getFeaturedContent([]);
      expect(result).toEqual([]);
    });

    it('should strictly check for true value', () => {
      const mixedContent: ContentItem<any>[] = [
        { slug: 'true-bool', metadata: { title: 'True Bool', featured: true }, content: 'Content' },
        { slug: 'false-bool', metadata: { title: 'False Bool', featured: false }, content: 'Content' },
        { slug: 'string-true', metadata: { title: 'String True', featured: 'true' }, content: 'Content' },
        { slug: 'number-1', metadata: { title: 'Number 1', featured: 1 }, content: 'Content' },
        { slug: 'undefined', metadata: { title: 'Undefined' }, content: 'Content' },
      ];

      const result = getFeaturedContent(mixedContent);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('true-bool');
    });
  });
});