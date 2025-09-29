import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProjects,
  getProjectBySlug,
  getProjectsByCategory,
  getProjectsByClient,
  getFeaturedProjects,
  getClients,
  getCategories,
  formatDate,
  type Project,
  type ProjectMetadata,
} from './utils';

// Mock the lib modules
vi.mock('../lib/mdx', () => ({
  getMDXData: vi.fn(),
}));

vi.mock('../lib/content', () => ({
  getContentBySlug: vi.fn(),
  getContentByCategory: vi.fn(),
  getFeaturedContent: vi.fn(),
}));

vi.mock('../lib/data-loader', () => ({
  loadDataFile: vi.fn(),
}));

vi.mock('../lib/date', () => ({
  formatDate: vi.fn((date: string) => date),
}));

import { getMDXData } from '../lib/mdx';
import { getContentBySlug, getContentByCategory, getFeaturedContent } from '../lib/content';
import { loadDataFile } from '../lib/data-loader';
import { formatDate as formatDateBase } from '../lib/date';

describe('Project Utilities', () => {
  // Sample project data for testing
  const sampleProjects: Project[] = [
    {
      slug: 'project-1',
      metadata: {
        title: 'Project 1',
        slug: 'project-1',
        publishedAt: '2024-01-15',
        launchDate: '2024-02-01',
        featured: true,
        categorySlug: 'web-dev',
        clientSlug: 'client-a',
      },
      content: 'Project 1 content',
    },
    {
      slug: 'project-2',
      metadata: {
        title: 'Project 2',
        slug: 'project-2',
        publishedAt: '2024-01-10',
        launchDate: '2024-01-20',
        featured: false,
        categorySlug: 'mobile',
        clientSlug: 'client-b',
      },
      content: 'Project 2 content',
    },
    {
      slug: 'project-3',
      metadata: {
        title: 'Project 3',
        slug: 'project-3',
        publishedAt: '2024-02-01',
        // No launch date
        featured: true,
        categorySlug: 'web-dev',
        clientSlug: 'client-a',
      },
      content: 'Project 3 content',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should get and sort projects by launch date (newest first)', () => {
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);

      const result = getProjects();

      expect(getMDXData).toHaveBeenCalledWith(
        expect.stringContaining('projects/posts')
      );
      expect(result).toHaveLength(3);
      // Should be sorted by launch date (or publishedAt fallback)
      // Projects are sorted by date, with same dates maintaining input order
      expect(result[0].slug).toBe('project-1'); // 2024-02-01 (launchDate)
      expect(result[1].slug).toBe('project-3'); // 2024-02-01 (publishedAt as no launchDate)
      expect(result[2].slug).toBe('project-2'); // 2024-01-20 (launchDate)
    });

    it('should handle empty project list', () => {
      vi.mocked(getMDXData).mockReturnValue([]);

      const result = getProjects();

      expect(result).toEqual([]);
    });

    it('should use publishedAt when launchDate is not available', () => {
      const projectsWithoutLaunchDate: Project[] = [
        {
          slug: 'a',
          metadata: {
            title: 'A',
            slug: 'a',
            publishedAt: '2024-03-01',
          },
          content: 'A',
        },
        {
          slug: 'b',
          metadata: {
            title: 'B',
            slug: 'b',
            publishedAt: '2024-02-01',
          },
          content: 'B',
        },
      ];

      vi.mocked(getMDXData).mockReturnValue(projectsWithoutLaunchDate);

      const result = getProjects();

      expect(result[0].slug).toBe('a'); // More recent
      expect(result[1].slug).toBe('b');
    });

    it('should handle projects with same dates', () => {
      const sameDateProjects: Project[] = [
        {
          slug: 'same-1',
          metadata: {
            title: 'Same 1',
            slug: 'same-1',
            publishedAt: '2024-01-01',
            launchDate: '2024-02-01',
          },
          content: '',
        },
        {
          slug: 'same-2',
          metadata: {
            title: 'Same 2',
            slug: 'same-2',
            publishedAt: '2024-01-01',
            launchDate: '2024-02-01',
          },
          content: '',
        },
      ];

      vi.mocked(getMDXData).mockReturnValue(sameDateProjects);

      const result = getProjects();

      expect(result).toHaveLength(2);
      // Order should be stable (maintained from input when dates are equal)
    });
  });

  describe('getProjectBySlug', () => {
    it('should return project matching slug', () => {
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);
      vi.mocked(getContentBySlug).mockReturnValue(sampleProjects[1]);

      const result = getProjectBySlug('project-2');

      expect(getContentBySlug).toHaveBeenCalledWith(
        expect.any(Array),
        'project-2'
      );
      expect(result).toBe(sampleProjects[1]);
    });

    it('should return undefined for non-existent slug', () => {
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);
      vi.mocked(getContentBySlug).mockReturnValue(undefined);

      const result = getProjectBySlug('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getProjectsByCategory', () => {
    it('should return projects in specified category', () => {
      const webDevProjects = sampleProjects.filter(
        p => p.metadata.categorySlug === 'web-dev'
      );
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);
      vi.mocked(getContentByCategory).mockReturnValue(webDevProjects);

      const result = getProjectsByCategory('web-dev');

      expect(getContentByCategory).toHaveBeenCalledWith(
        expect.any(Array),
        'web-dev',
        'categorySlug'
      );
      expect(result).toEqual(webDevProjects);
    });

    it('should return empty array for non-existent category', () => {
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);
      vi.mocked(getContentByCategory).mockReturnValue([]);

      const result = getProjectsByCategory('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('getProjectsByClient', () => {
    it('should return projects for specified client', () => {
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);

      const result = getProjectsByClient('client-a');

      expect(result).toHaveLength(2);
      expect(result.map(p => p.slug)).toEqual(['project-1', 'project-3']);
    });

    it('should return empty array for non-existent client', () => {
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);

      const result = getProjectsByClient('non-existent');

      expect(result).toEqual([]);
    });

    it('should handle projects without clientSlug', () => {
      const projectsWithoutClient: Project[] = [
        {
          slug: 'no-client',
          metadata: {
            title: 'No Client',
            slug: 'no-client',
            publishedAt: '2024-01-01',
          },
          content: '',
        },
      ];
      vi.mocked(getMDXData).mockReturnValue(projectsWithoutClient);

      const result = getProjectsByClient('any-client');

      expect(result).toEqual([]);
    });
  });

  describe('getFeaturedProjects', () => {
    it('should return featured projects', () => {
      const featuredProjects = sampleProjects.filter(
        p => p.metadata.featured === true
      );
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);
      vi.mocked(getFeaturedContent).mockReturnValue(featuredProjects);

      const result = getFeaturedProjects();

      expect(getFeaturedContent).toHaveBeenCalledWith(
        expect.any(Array),
        'featured'
      );
      expect(result).toEqual(featuredProjects);
    });

    it('should return empty array when no featured projects', () => {
      vi.mocked(getMDXData).mockReturnValue(sampleProjects);
      vi.mocked(getFeaturedContent).mockReturnValue([]);

      const result = getFeaturedProjects();

      expect(result).toEqual([]);
    });
  });

  describe('getClients', () => {
    it('should load and return clients data', () => {
      const mockClients = {
        'client-a': { name: 'Client A', slug: 'client-a' },
        'client-b': { name: 'Client B', slug: 'client-b' },
      };
      vi.mocked(loadDataFile).mockReturnValue(mockClients);

      const result = getClients();

      expect(loadDataFile).toHaveBeenCalledWith('data', 'clients.json', {});
      expect(result).toEqual(mockClients);
    });

    it('should return empty object when file not found', () => {
      vi.mocked(loadDataFile).mockReturnValue({});

      const result = getClients();

      expect(result).toEqual({});
    });
  });

  describe('getCategories', () => {
    it('should load and return categories data', () => {
      const mockCategories = {
        'web-dev': { name: 'Web Development', slug: 'web-dev' },
        'mobile': { name: 'Mobile Apps', slug: 'mobile' },
      };
      vi.mocked(loadDataFile).mockReturnValue(mockCategories);

      const result = getCategories();

      expect(loadDataFile).toHaveBeenCalledWith('data', 'categories.json', {});
      expect(result).toEqual(mockCategories);
    });

    it('should return empty object when file not found', () => {
      vi.mocked(loadDataFile).mockReturnValue({});

      const result = getCategories();

      expect(result).toEqual({});
    });
  });

  describe('formatDate', () => {
    it('should add time component when missing', () => {
      formatDate('2024-01-15');

      expect(formatDateBase).toHaveBeenCalledWith(
        '2024-01-15T00:00:00',
        { includeRelative: false }
      );
    });

    it('should preserve existing time component', () => {
      formatDate('2024-01-15T14:30:00');

      expect(formatDateBase).toHaveBeenCalledWith(
        '2024-01-15T14:30:00',
        { includeRelative: false }
      );
    });

    it('should pass includeRelative option', () => {
      formatDate('2024-01-15', true);

      expect(formatDateBase).toHaveBeenCalledWith(
        '2024-01-15T00:00:00',
        { includeRelative: true }
      );
    });

    it('should handle dates with timezone', () => {
      formatDate('2024-01-15T14:30:00Z');

      expect(formatDateBase).toHaveBeenCalledWith(
        '2024-01-15T14:30:00Z',
        { includeRelative: false }
      );
    });
  });
});