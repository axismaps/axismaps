#!/usr/bin/env node
/**
 * Upload the deep-zoom tile pyramids in tiles-build/ to Vercel Blob.
 *
 *   BLOB_READ_WRITE_TOKEN=... node scripts/upload-typographic-tiles.js [slug ...] [--force]
 *
 * Blob paths mirror the tilePath values in data/typographic-editions.json:
 *   typographic-maps/v1/<city>/<edition>.dzi
 *   typographic-maps/v1/<city>/<edition>_files/<level>/<col>_<row>.jpeg
 *
 * Tiles are immutable — a re-tile should bump TILE_VERSION in
 * scripts/import-typographic-maps.js rather than overwrite in place, so the long
 * cache lifetime stays truthful.
 */

const fs = require('fs');
const path = require('path');
const { put, list } = require('@vercel/blob');

const TILES_DIR = path.join(__dirname, '..', 'tiles-build');
const EDITIONS = path.join(__dirname, '..', 'data', 'typographic-editions.json');

// Vercel Blob rate-limits aggressive parallel writes; this keeps a pyramid upload
// fast without tripping it.
const CONCURRENCY = 12;
const CACHE_SECONDS = 60 * 60 * 24 * 365;

const CONTENT_TYPES = {
  '.dzi': 'application/xml',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml',
};

function walk(dir, base = dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, acc);
    else acc.push(path.relative(base, full));
  }
  return acc;
}

/** Files that make up one edition's pyramid, as [localPath, blobPath] pairs. */
function editionFiles(citySlug, editionId, tilePath) {
  const cityDir = path.join(TILES_DIR, citySlug);
  const dzi = path.join(cityDir, `${editionId}.dzi`);
  if (!fs.existsSync(dzi)) return null;

  const prefix = tilePath.replace(/\/[^/]+\.dzi$/, '');
  const pairs = [[dzi, tilePath]];

  const filesDir = path.join(cityDir, `${editionId}_files`);
  for (const rel of walk(filesDir)) {
    // libvips drops a vips-properties.xml alongside the levels; it is not part of
    // the DZI spec and nothing requests it.
    if (path.basename(rel) === 'vips-properties.xml') continue;
    pairs.push([
      path.join(filesDir, rel),
      `${prefix}/${editionId}_files/${rel.split(path.sep).join('/')}`,
    ]);
  }
  return pairs;
}

async function mapWithConcurrency(items, limit, fn) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function alreadyUploaded(prefix) {
  const { blobs } = await list({ prefix, limit: 1 });
  return blobs.length > 0;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      'BLOB_READ_WRITE_TOKEN is not set.\n' +
        'Create a Blob store in the Vercel dashboard, then run:\n' +
        '  vercel env pull .env.local\n' +
        '  export $(grep BLOB_READ_WRITE_TOKEN .env.local | xargs)'
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const slugs = args.filter((a) => !a.startsWith('--'));
  const editions = JSON.parse(fs.readFileSync(EDITIONS, 'utf-8'));

  let uploaded = 0;
  let skipped = 0;
  let baseUrl = null;

  for (const [citySlug, cityEditions] of Object.entries(editions)) {
    if (slugs.length && !slugs.includes(citySlug)) continue;

    for (const edition of cityEditions) {
      const name = `${citySlug}/${edition.id}`;
      if (!edition.tilePath) {
        console.log(`⏭  ${name} — no tiles (blocked source)`);
        continue;
      }

      const pairs = editionFiles(citySlug, edition.id, edition.tilePath);
      if (!pairs) {
        console.log(`⏭  ${name} — not built locally, run build-typographic-tiles.js`);
        continue;
      }

      const prefix = edition.tilePath.replace(/\.dzi$/, '_files/');
      if (!force && (await alreadyUploaded(prefix))) {
        console.log(`⏭  ${name} — already uploaded (--force to replace)`);
        skipped++;
        continue;
      }

      process.stdout.write(`▶  ${name} — ${pairs.length} files… `);
      const started = Date.now();

      const results = await mapWithConcurrency(pairs, CONCURRENCY, async ([local, blobPath]) =>
        put(blobPath, fs.createReadStream(local), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: CONTENT_TYPES[path.extname(local)] || 'application/octet-stream',
          cacheControlMaxAge: CACHE_SECONDS,
        })
      );

      const dziResult = results[0];
      if (dziResult && !baseUrl) {
        baseUrl = dziResult.url.slice(0, dziResult.url.indexOf(edition.tilePath));
      }
      console.log(`done in ${((Date.now() - started) / 1000).toFixed(0)}s`);
      uploaded++;
    }
  }

  console.log(`\n${uploaded} edition(s) uploaded, ${skipped} skipped.`);
  if (baseUrl) {
    console.log(`\nSet this in .env.local and in the Vercel project env:\n  NEXT_PUBLIC_TILE_BASE_URL=${baseUrl.replace(/\/$/, '')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
