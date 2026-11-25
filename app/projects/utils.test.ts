import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProjects,
  getProjectBySlug,
  getProjectsByCategory,
  getProjectsByClient,
  getFeaturedProjects,
  getProjectGallery,
  getProjectVideoAsset,
  getHomepageFilms,
  resolveProjectHero,
  getClients,
  getCategories,
  formatDate,
  type Project,
  type ProjectMetadata,
} from './utils';

// getProjectGallery reads the gallery directory off disk, and
// getProjectVideoAsset reads the video sidecars
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

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

import fs from 'fs';
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

  describe('getProjectGallery', () => {
    it('should return empty array when the gallery directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(getProjectGallery('no-gallery')).toEqual([]);
      expect(fs.readdirSync).not.toHaveBeenCalled();
    });

    it('should return public paths for image files, sorted by filename', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        '02-second.jpg',
        '01-first.png',
        '03-third.webp',
      ] as any);

      expect(getProjectGallery('demo')).toEqual([
        '/images/projects/demo/01-first.png',
        '/images/projects/demo/02-second.jpg',
        '/images/projects/demo/03-third.webp',
      ]);
    });

    it('should filter out non-image files', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        '01-shot.jpg',
        '.DS_Store',
        'notes.txt',
      ] as any);

      expect(getProjectGallery('demo')).toEqual([
        '/images/projects/demo/01-shot.jpg',
      ]);
    });

    it('should order a tenth image after the second, not the first', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        '10-tenth.jpg',
        '02-second.jpg',
        '01-first.jpg',
      ] as any);

      expect(getProjectGallery('demo')).toEqual([
        '/images/projects/demo/01-first.jpg',
        '/images/projects/demo/02-second.jpg',
        '/images/projects/demo/10-tenth.jpg',
      ]);
    });

    it('should refuse a slug that escapes the projects image directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      expect(getProjectGallery('../../../etc')).toEqual([]);
      expect(fs.readdirSync).not.toHaveBeenCalled();
    });

    it('should return empty array when the directory cannot be read', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('EACCES');
      });
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(getProjectGallery('demo')).toEqual([]);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('getProjectVideoAsset', () => {
    const ready = {
      status: 'ready',
      originalFilePath: 'videos/demo.mp4',
      provider: 'mux',
      providerMetadata: {
        mux: { uploadId: 'upload-1', assetId: 'asset-1', playbackId: 'play-1', thumbnailTime: 3.5 },
      },
      blurDataURL: 'data:image/webp;base64,AAAA',
      size: 1234,
      createdAt: 0,
      updatedAt: 0,
    };
    // What reaches the page: only the fields playback reads
    const playable = {
      status: 'ready',
      provider: 'mux',
      providerMetadata: { mux: { playbackId: 'play-1', thumbnailTime: 3.5 } },
      blurDataURL: 'data:image/webp;base64,AAAA',
    };

    // Only the named sidecar exists on disk
    const sidecarAt = (name: string, contents: string) => {
      vi.mocked(fs.existsSync).mockImplementation((file) =>
        String(file).endsWith(`/videos/${name}`)
      );
      vi.mocked(fs.readFileSync).mockReturnValue(contents);
    };

    it('should return the playable part of videos/{slug}.mp4.json', () => {
      sidecarAt('demo.mp4.json', JSON.stringify(ready));
      // Upload and asset ids, size and the original's path stay server-side
      expect(getProjectVideoAsset('demo')).toEqual(playable);
    });

    it('should find a sidecar for an original kept in another format', () => {
      sidecarAt('demo.mov.json', JSON.stringify(ready));
      expect(getProjectVideoAsset('demo')).toEqual(playable);
    });

    it('should pass over a stale sidecar for a ready one in another format', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation((file) =>
        String(file).endsWith('/videos/demo.mp4.json')
          ? JSON.stringify({ ...ready, status: 'errored' })
          : JSON.stringify(ready)
      );
      expect(getProjectVideoAsset('demo')).toEqual(playable);
    });

    it('should return null when the project has no sidecar', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(getProjectVideoAsset('demo')).toBeNull();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should pass over an upload that is still processing, and say so', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // next-video would fall back to the original, which is never deployed
      sidecarAt('demo.mp4.json', JSON.stringify({ ...ready, status: 'processing' }));
      expect(getProjectVideoAsset('demo')).toBeNull();
      // A Vercel build runs no tests, so the build log is where this shows
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('demo.mp4.json'));
      warn.mockRestore();
    });

    it('should pass over a sidecar without a playback id', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      sidecarAt(
        'demo.mp4.json',
        JSON.stringify({ ...ready, providerMetadata: { mux: { assetId: 'asset-1' } } })
      );
      expect(getProjectVideoAsset('demo')).toBeNull();
    });

    it('should return null and log when the sidecar is not valid JSON', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      sidecarAt('demo.mp4.json', '{ not json');
      expect(getProjectVideoAsset('demo')).toBeNull();
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should not read outside the videos directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      expect(getProjectVideoAsset('../secrets')).toBeNull();
      expect(fs.existsSync).not.toHaveBeenCalled();
    });
  });

  describe('getHomepageFilms', () => {
    const asset = (id: string) => ({
      status: 'ready' as const,
      provider: 'mux' as const,
      providerMetadata: { mux: { playbackId: id } },
    });
    const project = (slug: string, metadata: Record<string, unknown> = {}) =>
      ({
        slug,
        content: '',
        metadata: { title: slug.toUpperCase(), slug, publishedAt: '2024-01-01', featured: true, ...metadata },
      }) as any;
    // Every project has a film except the ones named here.
    const findAsset = (without: string[] = []) => (slug: string) =>
      without.includes(slug) ? null : asset(`play-${slug}`);

    const summary = (films: ReturnType<typeof getHomepageFilms>) =>
      films.map((f) => (f.lead ? `${f.slug}*` : f.slug));

    it('lists featured projects with a film newest first, the newest leading', () => {
      const films = getHomepageFilms(
        [project('a'), project('b'), project('c')],
        5,
        findAsset(['a']),
      );
      expect(summary(films)).toEqual(['b*', 'c']);
    });

    it('lets the flag pick the lead without moving it out of date order', () => {
      const films = getHomepageFilms(
        [project('a'), project('b'), project('c', { homepageVideo: true })],
        5,
        findAsset(),
      );
      expect(summary(films)).toEqual(['a', 'b', 'c*']);
    });

    it('lets the flag pick a project that is not featured', () => {
      const films = getHomepageFilms(
        [project('a'), project('b', { featured: false, homepageVideo: true })],
        5,
        findAsset(),
      );
      expect(summary(films)).toEqual(['a', 'b*']);
    });

    it('gives a flagged project past the cut the last place', () => {
      const films = getHomepageFilms(
        [project('a'), project('b'), project('c'), project('d', { homepageVideo: true })],
        2,
        findAsset(),
      );
      expect(summary(films)).toEqual(['a', 'd*']);
    });

    it('falls back to the newest when the flagged project has no ready film', () => {
      const films = getHomepageFilms(
        [project('a'), project('b', { homepageVideo: true })],
        5,
        findAsset(['b']),
      );
      expect(summary(films)).toEqual(['a*']);
    });

    it('leaves out projects that are not featured, and stops at the limit', () => {
      const films = getHomepageFilms(
        [project('a'), project('b', { featured: false }), project('c'), project('d')],
        2,
        findAsset(),
      );
      expect(summary(films)).toEqual(['a*', 'c']);
    });

    it('carries the title, mute flag and asset', () => {
      const [film] = getHomepageFilms(
        [project('a', { title: 'A film', videoMuted: true })],
        5,
        findAsset(),
      );
      expect(film).toEqual({
        slug: 'a',
        title: 'A film',
        muted: true,
        lead: true,
        asset: asset('play-a'),
      });
    });

    it('is empty for a limit below one, flag or no flag', () => {
      expect(getHomepageFilms([project('a', { homepageVideo: true })], 0, findAsset())).toEqual([]);
    });

    it('is empty when no featured project has a film', () => {
      expect(getHomepageFilms([project('a')], 5, () => null)).toEqual([]);
    });
  });

  describe('resolveProjectHero', () => {
    const gallery = ['/images/projects/demo/01.jpg', '/images/projects/demo/02.jpg'];
    const asset = {
      status: 'ready' as const,
      originalFilePath: 'videos/demo.mp4',
      provider: 'mux',
      providerMetadata: { mux: { assetId: 'asset-1', playbackId: 'play-1' } },
      createdAt: 0,
      updatedAt: 0,
    };

    it('should lead with the Mux film ahead of the videoUrl', () => {
      expect(
        resolveProjectHero(
          { videoUrl: 'https://vimeo.com/123', coverImage: '/cover.jpg' },
          gallery,
          asset
        )
      ).toEqual({ kind: 'video', video: { source: 'mux', asset }, images: gallery });
    });

    it('should show a Mux film alone when the gallery has one image', () => {
      expect(resolveProjectHero({ coverImage: '/cover.jpg' }, [gallery[0]], asset)).toEqual({
        kind: 'video',
        video: { source: 'mux', asset },
        images: [],
      });
    });

    it('should keep the videoUrl while the Mux upload is not ready', () => {
      expect(
        resolveProjectHero(
          { videoUrl: 'https://vimeo.com/123' },
          [],
          { ...asset, status: 'processing' }
        )
      ).toEqual({
        kind: 'video',
        video: { source: 'embed', url: 'https://vimeo.com/123' },
        images: [],
      });
    });

    it('should lead with a video and keep the gallery after it', () => {
      expect(
        resolveProjectHero(
          { videoUrl: 'https://vimeo.com/123', coverImage: '/cover.jpg' },
          gallery
        )
      ).toEqual({
        kind: 'video',
        video: { source: 'embed', url: 'https://vimeo.com/123' },
        images: gallery,
      });
    });

    it('should show a video alone when there is no gallery', () => {
      expect(
        resolveProjectHero(
          { videoUrl: 'https://vimeo.com/123', coverImage: '/cover.jpg' },
          []
        )
      ).toEqual({
        kind: 'video',
        video: { source: 'embed', url: 'https://vimeo.com/123' },
        images: [],
      });
    });

    it('should fall back to the gallery when the video cannot be embedded', () => {
      expect(
        resolveProjectHero({ videoUrl: 'https://example.com/clip.mp4' }, gallery)
      ).toEqual({ kind: 'gallery', images: gallery });
    });

    it('should fall back to coverImage when the video cannot be embedded', () => {
      expect(
        resolveProjectHero(
          { videoUrl: 'https://vimeo.com/axismaps', coverImage: '/cover.jpg' },
          []
        )
      ).toEqual({ kind: 'image', src: '/cover.jpg' });
    });

    it('should leave a lone gallery image out of a video carousel', () => {
      expect(
        resolveProjectHero({ videoUrl: 'https://vimeo.com/123' }, [gallery[0]])
      ).toEqual({
        kind: 'video',
        video: { source: 'embed', url: 'https://vimeo.com/123' },
        images: [],
      });
    });

    it('should prefer the gallery over coverImage', () => {
      expect(resolveProjectHero({ coverImage: '/cover.jpg' }, gallery)).toEqual({
        kind: 'gallery',
        images: gallery,
      });
    });

    it('should fall back to coverImage when there is no gallery', () => {
      expect(resolveProjectHero({ coverImage: '/cover.jpg' }, [])).toEqual({
        kind: 'image',
        src: '/cover.jpg',
      });
    });

    it('should show a lone gallery image rather than paging through one slide', () => {
      expect(
        resolveProjectHero({ coverImage: '/cover.jpg' }, [gallery[0]])
      ).toEqual({ kind: 'image', src: gallery[0] });
    });

    it('should use a lone gallery image when coverImage is unset', () => {
      expect(resolveProjectHero({}, [gallery[0]])).toEqual({
        kind: 'image',
        src: gallery[0],
      });
    });

    it('should resolve to nothing when there is no media at all', () => {
      expect(resolveProjectHero({}, [])).toEqual({ kind: 'none' });
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