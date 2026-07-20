#!/usr/bin/env node
/**
 * Build DZI deep-zoom tile pyramids for the typographic maps gallery.
 *
 *   node scripts/build-typographic-tiles.js [slug ...] [--dpi 400] [--force]
 *
 * With no slugs it builds every unblocked edition in scripts/typographic-sources.json.
 *
 * Pipeline per edition:  vector .ai/.pdf --pdftoppm--> TIFF --sharp.tile--> DZI
 *
 * The intermediate TIFF is large (a 24x36 in page at 400 dpi is 9600x14400 px,
 * ~415 MB uncompressed) and is deleted once the pyramid is written.
 *
 * Requires `pdftoppm` (poppler: brew install poppler). Uses sharp, which bundles
 * libvips and provides the same dzsave the vips CLI does.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const MANIFEST = path.join(__dirname, 'typographic-sources.json');
const OUT_ROOT = path.join(__dirname, '..', 'tiles-build');
const PHOTO_ROOT = path.join(__dirname, '..', 'public', 'images', 'typographic-maps');

// Photo editions ship as ordinary images in public/, not tiles. They are already
// small enough to serve directly; cap the long edge so a 2000px original doesn't
// become an unnecessarily heavy page load.
const PHOTO_MAX_EDGE = 2000;

// A 24x36 in page at 400 dpi is 138 MP, well past sharp's 268 MP default guard
// for larger sheets — disable it rather than tune it per file.
const SHARP_INPUT = { limitInputPixels: false, unlimited: true };

function parseArgs(argv) {
  const slugs = [];
  let dpi = null;
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dpi') dpi = parseInt(argv[++i], 10);
    else if (argv[i] === '--force') force = true;
    else slugs.push(argv[i]);
  }
  return { slugs, dpi, force };
}

/**
 * Illustrator files saved without "Create PDF Compatible File" still carry a
 * valid one-page PDF wrapper, so pdfinfo succeeds and the mime type looks like
 * application/pdf — but the only thing in the content stream is Adobe's
 * "saved without PDF Content" placeholder. Rendering one silently produces a
 * page of instructional text instead of the artwork, so check before spending
 * minutes on a render.
 */
function isRenderable(file) {
  try {
    const text = execFileSync('pdftotext', [file, '-'], {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024,
    });
    return !text.includes('saved without PDF Content');
  } catch (err) {
    return false;
  }
}

function pageSizePts(file) {
  const info = execFileSync('pdfinfo', [file], { encoding: 'utf-8' });
  const match = info.match(/Page size:\s+([\d.]+) x ([\d.]+) pts/);
  if (!match) throw new Error(`could not read page size from ${file}`);
  return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
}

function rasterize(file, dpi, outPrefix) {
  execFileSync(
    'pdftoppm',
    [
      '-tiff',
      '-tiffcompression', 'lzw',
      '-r', String(dpi),
      '-aa', 'yes',
      '-aaVector', 'yes',
      '-f', '1',
      '-l', '1',
      file,
      outPrefix,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  );
  // pdftoppm appends a page number; single page always lands on -1.
  return `${outPrefix}-1.tif`;
}

function dirStats(dir) {
  let files = 0;
  let bytes = 0;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else {
        files++;
        bytes += fs.statSync(p).size;
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return { files, bytes };
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Copy an edition's photographs into public/images/typographic-maps/<city>/.
 * Used where a photograph says more than a render — the letterpress prints, whose
 * impression and paper stock don't survive being redrawn from vector.
 */
async function buildPhotoEdition(city, edition, roots, opts) {
  const name = `${city.slug}/${edition.id}`;
  const srcDir = path.join(roots[edition.photoRoot], edition.photoDir);
  if (!fs.existsSync(srcDir)) {
    console.error(`✗  ${name} — photo directory missing: ${srcDir}`);
    return { name, status: 'missing' };
  }

  const sources = fs
    .readdirSync(srcDir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();
  if (!sources.length) {
    console.error(`✗  ${name} — no images in ${srcDir}`);
    return { name, status: 'missing' };
  }

  const outDir = path.join(PHOTO_ROOT, city.slug);
  fs.mkdirSync(outDir, { recursive: true });

  const written = [];
  for (const [i, file] of sources.entries()) {
    const out = path.join(outDir, `${edition.id}-${i + 1}.jpg`);
    if (fs.existsSync(out) && !opts.force) {
      written.push(out);
      continue;
    }
    await sharp(path.join(srcDir, file), SHARP_INPUT)
      .rotate() // honour EXIF orientation before resizing
      .resize({ width: PHOTO_MAX_EDGE, height: PHOTO_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(out);
    written.push(out);
  }

  const bytes = written.reduce((sum, f) => sum + fs.statSync(f).size, 0);
  console.log(`✓  ${name} — ${written.length} photos, ${mb(bytes)}`);
  return { name, status: 'built', files: written.length, bytes };
}

async function buildEdition(city, edition, cfg, roots, opts) {
  if (edition.photoDir) return buildPhotoEdition(city, edition, roots, opts);

  const name = `${city.slug}/${edition.id}`;
  const source = path.join(roots[edition.root], edition.file);
  const outDir = path.join(OUT_ROOT, city.slug);
  const basename = edition.id;
  const dziPath = path.join(outDir, `${basename}.dzi`);

  if (edition.blocked) {
    console.log(`⏭  ${name} — skipped (blocked: source not readable)`);
    return { name, status: 'blocked' };
  }
  if (fs.existsSync(dziPath) && !opts.force) {
    console.log(`⏭  ${name} — already built (--force to rebuild)`);
    return { name, status: 'cached' };
  }
  if (!fs.existsSync(source)) {
    console.error(`✗  ${name} — source missing: ${source}`);
    return { name, status: 'missing' };
  }
  if (!isRenderable(source)) {
    console.error(
      `✗  ${name} — ${path.basename(source)} has no PDF content. ` +
        `Re-save it from Illustrator with "Create PDF Compatible File" enabled.`
    );
    return { name, status: 'unreadable' };
  }

  const dpi = opts.dpi || cfg.dpi;
  const pts = pageSizePts(source);
  const px = {
    width: Math.round((pts.width / 72) * dpi),
    height: Math.round((pts.height / 72) * dpi),
  };

  console.log(
    `▶  ${name} — ${(pts.width / 72).toFixed(1)}×${(pts.height / 72).toFixed(1)} in ` +
      `→ ${px.width}×${px.height} px @ ${dpi} dpi`
  );

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'typomap-'));
  const started = Date.now();
  try {
    const tif = rasterize(source, dpi, path.join(tmpDir, 'page'));

    fs.mkdirSync(outDir, { recursive: true });
    // sharp writes <basename>.dzi + <basename>_files/ next to the given path.
    await sharp(tif, SHARP_INPUT)
      .jpeg({ quality: cfg.jpegQuality, mozjpeg: true })
      .tile({
        size: cfg.tileSize,
        overlap: cfg.overlap,
        layout: 'dz',
        depth: 'onepixel',
      })
      .toFile(path.join(outDir, `${basename}.dz`));

    const stats = dirStats(path.join(outDir, `${basename}_files`));
    const secs = ((Date.now() - started) / 1000).toFixed(0);
    console.log(`✓  ${name} — ${stats.files} tiles, ${mb(stats.bytes)}, ${secs}s`);
    return { name, status: 'built', ...stats, px };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
  const { roots, render: cfg } = manifest;

  const cities = opts.slugs.length
    ? manifest.cities.filter((c) => opts.slugs.includes(c.slug))
    : manifest.cities;

  if (!cities.length) {
    console.error(`No cities matched: ${opts.slugs.join(', ')}`);
    process.exit(1);
  }

  const results = [];
  for (const city of cities) {
    for (const edition of city.editions) {
      results.push(await buildEdition(city, edition, cfg, roots, opts));
    }
  }

  const built = results.filter((r) => r.status === 'built');
  const failed = results.filter((r) => ['missing', 'unreadable'].includes(r.status));
  const totals = built.reduce(
    (acc, r) => ({ files: acc.files + r.files, bytes: acc.bytes + r.bytes }),
    { files: 0, bytes: 0 }
  );

  console.log(
    `\n${built.length} built · ${totals.files} files · ${mb(totals.bytes)} total` +
      ` · ${results.filter((r) => r.status === 'blocked').length} blocked` +
      ` · ${results.filter((r) => r.status === 'cached').length} cached`
  );
  if (failed.length) {
    console.error(`\n${failed.length} FAILED:`);
    for (const f of failed) console.error(`  ${f.name} (${f.status})`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
