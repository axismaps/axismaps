import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseFrontmatter, getMDXFiles, readMDXFile, getMDXData } from './mdx';

// Mock fs module
vi.mock('fs');

describe('MDX Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter with string values', () => {
      const content = `---
title: Test Title
slug: test-slug
publishedAt: 2024-01-01
---

This is the content.`;

      const result = parseFrontmatter(content);

      expect(result.metadata).toEqual({
        title: 'Test Title',
        slug: 'test-slug',
        publishedAt: '2024-01-01',
      });
      expect(result.content).toBe('This is the content.');
    });

    it('should parse frontmatter with boolean values', () => {
      const content = `---
title: Test
featured: true
draft: false
---

Content here.`;

      const result = parseFrontmatter(content);

      expect(result.metadata.featured).toBe(true);
      expect(result.metadata.draft).toBe(false);
    });

    it('should parse frontmatter with numeric order field', () => {
      const content = `---
title: Test
order: 42
---

Content.`;

      const result = parseFrontmatter(content);

      expect(result.metadata.order).toBe(42);
      expect(typeof result.metadata.order).toBe('number');
    });

    it('should handle frontmatter with colons in values', () => {
      const content = `---
title: Test: A Subtitle
url: https://example.com:8080/path
---

Content.`;

      const result = parseFrontmatter(content);

      expect(result.metadata.title).toBe('Test: A Subtitle');
      expect(result.metadata.url).toBe('https://example.com:8080/path');
    });

    it('should strip quotes from values', () => {
      const content = `---
title: "Quoted Title"
slug: 'single-quoted'
---

Content.`;

      const result = parseFrontmatter(content);

      expect(result.metadata.title).toBe('Quoted Title');
      expect(result.metadata.slug).toBe('single-quoted');
    });

    it('should throw error when no frontmatter is found', () => {
      const content = 'Just content without frontmatter';

      expect(() => parseFrontmatter(content)).toThrow('No frontmatter found in file');
    });

    it('should handle empty content after frontmatter', () => {
      const content = `---
title: Test
---`;

      const result = parseFrontmatter(content);

      expect(result.content).toBe('');
    });

    it('should handle multiline values', () => {
      const content = `---
title: Test
description: This is a
  multiline description
  with multiple lines
---

Content.`;

      const result = parseFrontmatter(content);

      expect(result.metadata.title).toBe('Test');
      // Note: Current implementation doesn't handle multiline properly
      // This test documents the current behavior
      expect(result.metadata.description).toBe('This is a');
    });
  });

  describe('getMDXFiles', () => {
    it('should return MDX files from a directory', () => {
      const mockFiles = ['post1.mdx', 'post2.mdx', 'post3.md', 'readme.txt'];
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);

      const result = getMDXFiles('/test/dir');

      expect(fs.existsSync).toHaveBeenCalledWith('/test/dir');
      expect(fs.readdirSync).toHaveBeenCalledWith('/test/dir');
      expect(result).toEqual(['post1.mdx', 'post2.mdx']);
    });

    it('should return empty array if directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = getMDXFiles('/nonexistent/dir');

      expect(fs.existsSync).toHaveBeenCalledWith('/nonexistent/dir');
      expect(fs.readdirSync).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array if no MDX files in directory', () => {
      const mockFiles = ['post.md', 'readme.txt', 'config.json'];
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);

      const result = getMDXFiles('/test/dir');

      expect(result).toEqual([]);
    });
  });

  describe('readMDXFile', () => {
    it('should read and parse MDX file', () => {
      const mockContent = `---
title: Test Post
author: John Doe
---

This is the post content.`;

      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const result = readMDXFile('/test/post.mdx');

      expect(fs.readFileSync).toHaveBeenCalledWith('/test/post.mdx', 'utf-8');
      expect(result.metadata).toEqual({
        title: 'Test Post',
        author: 'John Doe',
      });
      expect(result.content).toBe('This is the post content.');
    });

    it('should handle file read errors', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => readMDXFile('/nonexistent.mdx')).toThrow('File not found');
    });

    it('should handle frontmatter parsing errors', () => {
      const mockContent = 'Content without frontmatter';
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      expect(() => readMDXFile('/test/invalid.mdx')).toThrow('No frontmatter found in file');
    });
  });

  describe('getMDXData', () => {
    it('should get all MDX data from a directory', () => {
      const mockFiles = ['post1.mdx', 'post2.mdx'];
      const mockContent1 = `---
title: Post 1
order: 1
---

Content 1`;
      const mockContent2 = `---
title: Post 2
order: 2
---

Content 2`;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        if (filePath.toString().includes('post1.mdx')) return mockContent1;
        if (filePath.toString().includes('post2.mdx')) return mockContent2;
        return '';
      });

      const result = getMDXData('/test/dir');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        metadata: { title: 'Post 1', order: 1 },
        slug: 'post1',
        content: 'Content 1',
      });
      expect(result[1]).toEqual({
        metadata: { title: 'Post 2', order: 2 },
        slug: 'post2',
        content: 'Content 2',
      });
    });

    it('should extract slug from filename without extension', () => {
      const mockFiles = ['my-awesome-post.mdx'];
      const mockContent = `---
title: Awesome Post
---

Content`;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const result = getMDXData('/test/dir');

      expect(result[0].slug).toBe('my-awesome-post');
    });

    it('should return empty array for non-existent directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = getMDXData('/nonexistent/dir');

      expect(result).toEqual([]);
    });

    it('should handle files that cannot be read', () => {
      const mockFiles = ['unreadable.mdx'];
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // getMDXData will throw when it cannot read files
      expect(() => getMDXData('/test/dir')).toThrow('Permission denied');
    });
  });
});