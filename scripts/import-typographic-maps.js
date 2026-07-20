#!/usr/bin/env node
/**
 * Generate app/typographic-maps/posts/*.mdx from the archived store catalogue.
 *
 *   node scripts/import-typographic-maps.js
 *
 * The store at store.axismaps.com is being shut down. data/typographic-store-products.json
 * is a verbatim capture of its /products.json, and is the source of record for the per-city
 * copy. Generating the MDX from it (rather than retyping) keeps the prose exactly as
 * published and makes it cheap to regenerate if the template changes.
 *
 * Every poster description follows the same shape:
 *   para 1  boilerplate, identical across all cities ("...using nothing but type...")
 *   para 2+ the city-specific geographic tour  <- this is what becomes the MDX body
 *   last    "The map is based on place names and geography as they appear in Open Street Map."
 *
 * Paragraph 1 and the Open Street Map line are rendered once by the page template, so they
 * are stripped here rather than repeated on twelve pages.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PRODUCTS = path.join(__dirname, '..', 'data', 'typographic-store-products.json');
const SOURCES = path.join(__dirname, 'typographic-sources.json');
const OUT_DIR = path.join(__dirname, '..', 'app', 'typographic-maps', 'posts');
const EDITIONS_OUT = path.join(__dirname, '..', 'data', 'typographic-editions.json');

// Tile pyramids are versioned so they can be cached `immutable`. Bump when re-tiling.
const TILE_VERSION = 'v1';

// slug -> Shopify handle. Slugs match scripts/typographic-sources.json.
const HANDLES = {
  austin: 'austin-typographic-poster',
  boston: 'boston-typographic-poster',
  chicago: 'chicago-typographic-poster',
  london: 'london-typographic-poster',
  'los-angeles': 'los-angeles-typographic-poster',
  madison: 'madison-typographic-poster',
  minneapolis: 'minneapolis-typographic-poster',
  'new-york': 'new-york-city-typographic-poster',
  philadelphia: 'philadelphia-typographic-poster',
  'san-francisco': 'san-francisco-typographic-poster',
  seattle: 'seattle-typographic-poster',
  'washington-dc': 'washington-dc-typographic-poster',
};

// The year each map was first published, from the Axis Maps blog timeline. The Shopify
// published_at dates are all 2018 (when the store migrated to Shopify) and are useless
// as a signal of when the artwork was actually made.
const FIRST_PUBLISHED = {
  boston: '2010-09-01',
  chicago: '2010-09-01',
  'san-francisco': '2010-12-01',
  'washington-dc': '2011-04-01',
  'new-york': '2011-04-01',
  minneapolis: '2011-07-01',
  london: '2012-08-01',
  philadelphia: '2012-08-01',
  seattle: '2012-08-01',
  madison: '2009-11-01',
  austin: '2013-10-01',
  'los-angeles': '2022-06-22',
};

const OSM_LINE = /^The map is based on place names and geography as they appear in Open Street Map\.$/;
const BOILERPLATE = /^This map accurately depicts .* using nothing but type\./;
const PRINT_BLURB = /^These matte, museum-quality posters/;

/** Turn a Shopify body_html into an ordered list of plain-text paragraphs. */
function toParagraphs(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, '—')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Make a value safe for the repo's flat `key: value` frontmatter parser.
 *
 * parseFrontmatter (app/lib/mdx.ts) strips the outer quote pair but never unescapes,
 * so writing `\"` would round-trip as a literal backslash-quote. Rather than escape,
 * fold straight double quotes to typographic ones — lossless to the reader, better
 * typography, and it can't confuse the parser. import-blogs.js sidesteps the same
 * limitation by folding to single quotes.
 */
function fm(value) {
  const text = String(value)
    .replace(/\s+/g, ' ')
    .replace(/"([^"]*)"/g, '“$1”')
    .replace(/"/g, '”')
    .trim();
  return `"${text}"`;
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(PRODUCTS, 'utf-8'));
  const products = catalogue.products || catalogue;
  const sources = JSON.parse(fs.readFileSync(SOURCES, 'utf-8'));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  for (const city of sources.cities) {
    const handle = HANDLES[city.slug];
    const product = products.find((p) => p.handle === handle);
    if (!product) {
      console.error(`✗ ${city.slug}: no product with handle "${handle}"`);
      continue;
    }

    const paragraphs = toParagraphs(product.body_html);
    const body = paragraphs.filter(
      (p) => !BOILERPLATE.test(p) && !OSM_LINE.test(p) && !PRINT_BLURB.test(p)
    );
    if (!body.length) {
      console.error(`✗ ${city.slug}: no city-specific copy survived filtering`);
      continue;
    }

    const sizes = (product.variants || []).map((v) => v.title).join(', ');

    // Deliberately minimal. Anything about the artwork itself — orientation,
    // print size per edition, how many editions there are — lives in
    // data/typographic-editions.json, which is the single source of truth the
    // viewer reads. Duplicating it here just lets the two drift.
    const frontmatter = [
      `title: ${fm(city.name)}`,
      `slug: ${fm(city.slug)}`,
      `publishedAt: ${fm(FIRST_PUBLISHED[city.slug])}`,
      `city: ${fm(city.name)}`,
      `teaser: ${fm(body[0].slice(0, 160).replace(/\s+\S*$/, '') + '…')}`,
      `printSizes: ${fm(sizes)}`,
    ].join('\n');

    const mdx = `---\n${frontmatter}\n---\n\n${body.join('\n\n')}\n`;
    fs.writeFileSync(path.join(OUT_DIR, `${city.slug}.mdx`), mdx);
    console.log(
      `✓ ${city.slug}.mdx — ${body.length} para, ${city.editions.length} edition(s)`
    );
    written++;
  }

  writeEditions(sources, await measurePhotos(sources));

  console.log(`\n${written}/${sources.cities.length} written to ${path.relative(process.cwd(), OUT_DIR)}`);
}

/** Measure every photo an edition references, keyed by absolute path. */
async function measurePhotos(sources) {
  const sizes = new Map();
  for (const city of sources.cities) {
    for (const edition of city.editions) {
      if (!edition.photoDir) continue;
      const dir = path.join(
        __dirname,
        '..',
        'public',
        'images',
        'typographic-maps',
        city.slug
      );
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter((n) => n.startsWith(`${edition.id}-`))) {
        const file = path.join(dir, f);
        const { width, height } = await sharp(file).metadata();
        sizes.set(file, { width, height });
      }
    }
  }
  return sizes;
}

/**
 * Emit the editions manifest the app reads at build time. The source manifest carries
 * absolute Google Drive paths, which must not ship — this projects it down to just what
 * the gallery needs, plus the tile path each pyramid was uploaded under.
 */
function writeEditions(sources, sizes) {
  const byCity = {};
  let total = 0;

  for (const city of sources.cities) {
    byCity[city.slug] = city.editions.map((edition) => {
      const base = {
        id: edition.id,
        label: edition.label,
        year: edition.year,
        orientation: edition.orientation,
        printSize: edition.printSize,
        letterpress: Boolean(edition.letterpress),
        primary: Boolean(edition.primary) || city.editions.length === 1,
      };

      // Photo editions are served straight from public/ — no tile pyramid. Used
      // where a photograph carries what a vector render can't.
      if (edition.photoDir) {
        const dir = path.join(
          __dirname,
          '..',
          'public',
          'images',
          'typographic-maps',
          city.slug
        );
        // Carry each photo's real pixel dimensions so next/image can reserve the
        // right box. These aren't uniform — the letterpress shots land between
        // 1333 and 1335 px tall — so assuming a single ratio causes layout shift.
        const photos = fs.existsSync(dir)
          ? fs
              .readdirSync(dir)
              .filter((f) => f.startsWith(`${edition.id}-`))
              .sort()
              .map((f) => ({
                src: `/images/typographic-maps/${city.slug}/${f}`,
                ...sizes.get(path.join(dir, f)),
              }))
          : [];
        return { ...base, tilePath: null, photos };
      }

      return {
        ...base,
        // Relative to NEXT_PUBLIC_TILE_BASE_URL. Absent while an edition is blocked.
        tilePath: edition.blocked
          ? null
          : `typographic-maps/${TILE_VERSION}/${city.slug}/${edition.id}.dzi`,
        photos: [],
      };
    });
    total += byCity[city.slug].length;
  }

  fs.writeFileSync(EDITIONS_OUT, JSON.stringify(byCity, null, 2) + '\n');
  const all = Object.values(byCity).flat();
  const photoEditions = all.filter((e) => e.photos.length).length;
  const blocked = all.filter((e) => !e.tilePath && !e.photos.length).length;
  console.log(
    `\n✓ ${path.relative(process.cwd(), EDITIONS_OUT)} — ${total} editions` +
      ` (${photoEditions} shown as photographs)` +
      (blocked ? `, ${blocked} awaiting a readable source` : '')
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
