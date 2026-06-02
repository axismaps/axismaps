import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBlogPosts,
  getBlogPostBySlug,
  formatDate,
  type Blog,
} from './utils';

// Mock the lib modules
vi.mock('../lib/mdx', () => ({
  getMDXData: vi.fn(),
}));

vi.mock('../lib/content', () => ({
  getContentBySlug: vi.fn(),
}));

vi.mock('../lib/date', () => ({
  formatDate: vi.fn((date: string) => date),
}));

import { getMDXData } from '../lib/mdx';
import { getContentBySlug } from '../lib/content';
import { formatDate as formatDateBase } from '../lib/date';

describe('Blog Utilities', () => {
  const samplePosts: Blog[] = [
    {
      slug: 'post-1',
      metadata: {
        title: 'Post 1',
        slug: 'post-1',
        publishedAt: '2018-01-15',
        author: 'andy-woodruff',
        authorName: 'Andy Woodruff',
      },
      content: 'Post 1 content',
    },
    {
      slug: 'post-2',
      metadata: {
        title: 'Post 2',
        slug: 'post-2',
        publishedAt: '2019-06-10',
        author: 'david-heyman',
        authorName: 'David Heyman',
      },
      content: 'Post 2 content',
    },
    {
      slug: 'post-3',
      metadata: {
        title: 'Post 3',
        slug: 'post-3',
        publishedAt: '2016-02-01',
      },
      content: 'Post 3 content',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBlogPosts', () => {
    it('should get and sort posts by published date (newest first)', () => {
      vi.mocked(getMDXData).mockReturnValue(samplePosts);

      const result = getBlogPosts();

      expect(getMDXData).toHaveBeenCalledWith(
        expect.stringContaining('blog/posts')
      );
      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe('post-2'); // 2019-06-10
      expect(result[1].slug).toBe('post-1'); // 2018-01-15
      expect(result[2].slug).toBe('post-3'); // 2016-02-01
    });

    it('should handle empty post list', () => {
      vi.mocked(getMDXData).mockReturnValue([]);

      const result = getBlogPosts();

      expect(result).toEqual([]);
    });
  });

  describe('getBlogPostBySlug', () => {
    it('should return post matching slug', () => {
      vi.mocked(getMDXData).mockReturnValue(samplePosts);
      vi.mocked(getContentBySlug).mockReturnValue(samplePosts[1]);

      const result = getBlogPostBySlug('post-2');

      expect(getContentBySlug).toHaveBeenCalledWith(
        expect.any(Array),
        'post-2'
      );
      expect(result).toBe(samplePosts[1]);
    });

    it('should return undefined for non-existent slug', () => {
      vi.mocked(getMDXData).mockReturnValue(samplePosts);
      vi.mocked(getContentBySlug).mockReturnValue(undefined);

      const result = getBlogPostBySlug('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('formatDate', () => {
    it('should add time component when missing', () => {
      formatDate('2018-01-15');

      expect(formatDateBase).toHaveBeenCalledWith(
        '2018-01-15T00:00:00',
        { includeRelative: false }
      );
    });

    it('should preserve existing time component', () => {
      formatDate('2018-01-15T14:30:00');

      expect(formatDateBase).toHaveBeenCalledWith(
        '2018-01-15T14:30:00',
        { includeRelative: false }
      );
    });

    it('should pass includeRelative option', () => {
      formatDate('2018-01-15', true);

      expect(formatDateBase).toHaveBeenCalledWith(
        '2018-01-15T00:00:00',
        { includeRelative: true }
      );
    });
  });
});
