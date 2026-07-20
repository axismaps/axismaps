import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getTypographicMaps,
  getTypographicMapBySlug,
  getEditions,
  getViewableEditions,
  getPress,
  getFeaturedPress,
  tileUrl,
  type TypographicMap,
  type Edition,
} from './utils';

vi.mock('../lib/mdx', () => ({ getMDXData: vi.fn() }));
vi.mock('../lib/content', () => ({ getContentBySlug: vi.fn() }));
vi.mock('../lib/data-loader', () => ({ loadDataFile: vi.fn() }));

import { getMDXData } from '../lib/mdx';
import { getContentBySlug } from '../lib/content';
import { loadDataFile } from '../lib/data-loader';

const map = (city: string, slug: string): TypographicMap => ({
  slug,
  metadata: {
    title: city,
    slug,
    city,
    publishedAt: '2012-08-01',
    teaser: `${city} teaser`,
  },
  content: `${city} content`,
});

const edition = (over: Partial<Edition> = {}): Edition => ({
  id: 'poster',
  label: 'Poster',
  year: 2012,
  orientation: 'portrait',
  printSize: '24 × 36 in',
  letterpress: false,
  primary: true,
  tilePath: 'typographic-maps/v1/boston/poster.dzi',
  photos: [],
  ...over,
});

describe('typographic map utilities', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getTypographicMaps', () => {
    it('sorts cities alphabetically rather than by date', () => {
      vi.mocked(getMDXData).mockReturnValue([
        map('Seattle', 'seattle'),
        map('Austin', 'austin'),
        map('London', 'london'),
      ] as any);

      expect(getTypographicMaps().map((m) => m.metadata.city)).toEqual([
        'Austin',
        'London',
        'Seattle',
      ]);
    });

    it('reads from the typographic-maps posts directory', () => {
      vi.mocked(getMDXData).mockReturnValue([] as any);
      getTypographicMaps();

      const dir = vi.mocked(getMDXData).mock.calls[0][0];
      expect(dir).toContain(path.join('app', 'typographic-maps', 'posts'));
    });
  });

  describe('getTypographicMapBySlug', () => {
    it('delegates to the shared content lookup', () => {
      const boston = map('Boston', 'boston');
      vi.mocked(getMDXData).mockReturnValue([boston] as any);
      vi.mocked(getContentBySlug).mockReturnValue(boston as any);

      expect(getTypographicMapBySlug('boston')).toBe(boston);
      expect(getContentBySlug).toHaveBeenCalledWith([boston], 'boston');
    });
  });

  describe('editions', () => {
    it('returns an empty array for a city with no editions entry', () => {
      vi.mocked(loadDataFile).mockReturnValue({});
      expect(getEditions('nowhere')).toEqual([]);
    });

    it('excludes editions with neither tiles nor photos from the viewable set', () => {
      vi.mocked(loadDataFile).mockReturnValue({
        london: [
          edition({ id: 'poster', tilePath: null }),
          edition({ id: 'letterpress', tilePath: 'typographic-maps/v1/london/letterpress.dzi' }),
        ],
      });

      expect(getEditions('london')).toHaveLength(2);
      expect(getViewableEditions('london').map((e) => e.id)).toEqual(['letterpress']);
    });

    it('treats a photo edition as viewable even without tiles', () => {
      // The Manhattan letterpress prints are shown as photographs: a vector render
      // can't convey the debossed type or the cotton stock.
      vi.mocked(loadDataFile).mockReturnValue({
        'new-york': [
          edition({ id: 'poster' }),
          edition({
            id: 'letterpress-black',
            primary: false,
            tilePath: null,
            photos: [{ src: '/images/typographic-maps/new-york/letterpress-black-1.jpg', width: 2000, height: 1334 }],
          }),
        ],
      });

      expect(getViewableEditions('new-york').map((e) => e.id)).toEqual([
        'poster',
        'letterpress-black',
      ]);
    });

    // Primary-edition selection is exercised in EditionViewer.test.tsx, where the
    // logic actually lives — it has to run client-side.
  });

  describe('press', () => {
    it('separates featured items from the rest', () => {
      vi.mocked(loadDataFile).mockReturnValue([
        { outlet: 'Gizmodo', title: 'A', date: '2010-10-11', url: 'a', featured: true },
        { outlet: 'Trendland', title: 'B', date: '2010-10-17', url: 'b' },
      ]);

      expect(getPress()).toHaveLength(2);
      expect(getFeaturedPress().map((p) => p.outlet)).toEqual(['Gizmodo']);
    });
  });

  describe('tileUrl', () => {
    const original = process.env.NEXT_PUBLIC_TILE_BASE_URL;
    afterEach(() => {
      process.env.NEXT_PUBLIC_TILE_BASE_URL = original;
    });

    it('joins the base URL and tile path, tolerating a trailing slash', () => {
      process.env.NEXT_PUBLIC_TILE_BASE_URL = 'https://blob.example.com/';
      expect(tileUrl('typographic-maps/v1/boston/poster.dzi')).toBe(
        'https://blob.example.com/typographic-maps/v1/boston/poster.dzi',
      );
    });

    it('returns null when tiles are unbuilt or the base URL is unset', () => {
      process.env.NEXT_PUBLIC_TILE_BASE_URL = 'https://blob.example.com';
      expect(tileUrl(null)).toBeNull();

      delete process.env.NEXT_PUBLIC_TILE_BASE_URL;
      expect(tileUrl('typographic-maps/v1/boston/poster.dzi')).toBeNull();
    });
  });
});

describe('generated content', () => {
  const root = path.join(process.cwd(), 'app', 'typographic-maps', 'posts');
  const editionsFile = path.join(process.cwd(), 'data', 'typographic-editions.json');

  it('has an MDX file for every city in the editions manifest', () => {
    const editions = JSON.parse(fs.readFileSync(editionsFile, 'utf-8'));
    for (const slug of Object.keys(editions)) {
      expect(fs.existsSync(path.join(root, `${slug}.mdx`))).toBe(true);
    }
  });

  it('ships every photo an edition references', () => {
    const editions = JSON.parse(fs.readFileSync(editionsFile, 'utf-8'));
    const referenced = Object.values(editions)
      .flat()
      .flatMap((e: any) => e.photos ?? []);

    expect(referenced.length).toBeGreaterThan(0);
    for (const photo of referenced) {
      expect(
        fs.existsSync(path.join(process.cwd(), 'public', photo.src)),
        `missing ${photo.src}`,
      ).toBe(true);
      expect(photo.width, photo.src).toBeGreaterThan(0);
      expect(photo.height, photo.src).toBeGreaterThan(0);
    }
  });

  it('gives every edition either tiles or photos, never both and never neither', () => {
    const editions = JSON.parse(fs.readFileSync(editionsFile, 'utf-8'));
    for (const [slug, list] of Object.entries(editions)) {
      for (const e of list as any[]) {
        const hasTiles = Boolean(e.tilePath);
        const hasPhotos = Boolean(e.photos?.length);
        expect(hasTiles !== hasPhotos, `${slug}/${e.id}`).toBe(true);
      }
    }
  });

  it('keeps frontmatter flat — the repo parser cannot read nested or multi-line values', () => {
    for (const file of fs.readdirSync(root)) {
      const raw = fs.readFileSync(path.join(root, file), 'utf-8');
      const block = /---\s*([\s\S]*?)\s*---/.exec(raw)?.[1] ?? '';
      for (const line of block.trim().split('\n')) {
        expect(line, `${file}: "${line}"`).toMatch(/^[a-zA-Z]+: .+$/);
      }
    }
  });

  it('never backslash-escapes a frontmatter value', () => {
    // parseFrontmatter strips the outer quote pair but does not unescape, so a `\"`
    // written into frontmatter would be read back with the backslash intact. The
    // importer folds straight quotes to typographic ones instead of escaping them.
    for (const file of fs.readdirSync(root)) {
      const raw = fs.readFileSync(path.join(root, file), 'utf-8');
      const block = /---\s*([\s\S]*?)\s*---/.exec(raw)?.[1] ?? '';
      expect(block, file).not.toContain('\\');
    }
  });

  // Note: plain http is permitted deliberately — The Map Room's 2010 archive is
  // only reachable over http, and an https URL for it 404s.
  it('gives every press item a resolvable-looking URL, outlet and title', () => {
    const press = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data', 'typographic-press.json'), 'utf-8'),
    );
    expect(press.length).toBeGreaterThan(0);
    for (const item of press) {
      expect(item.url, item.outlet).toMatch(/^https?:\/\//);
      expect(item.outlet).toBeTruthy();
      expect(item.title).toBeTruthy();
    }
  });

  it('does not attribute a quote to The Atlantic', () => {
    // The store's homepage misattributed a Fast Company line to The Atlantic;
    // verification found no Atlantic coverage of the maps at all.
    const press = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data', 'typographic-press.json'), 'utf-8'),
    );
    expect(press.some((p: { outlet: string }) => /atlantic/i.test(p.outlet))).toBe(false);
  });
});
