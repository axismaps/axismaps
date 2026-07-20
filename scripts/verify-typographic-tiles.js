#!/usr/bin/env node
/**
 * Verify every published edition actually resolves from the tile host.
 *
 *   NEXT_PUBLIC_TILE_BASE_URL=... node scripts/verify-typographic-tiles.js
 *
 * For each edition in data/typographic-editions.json this checks that:
 *   - the .dzi manifest fetches, parses, and reports plausible dimensions
 *   - the deepest pyramid level exists at its corner and centre tiles
 *   - an intermediate level exists (catches a partial upload)
 *   - tiles come back as JPEG, immutable-cached, and CORS-readable from the site
 *
 * Photo editions are checked against the files in public/ instead.
 * Exits non-zero if anything is missing, so it can gate a deploy.
 */

const fs = require('fs');
const path = require('path');

const EDITIONS = path.join(__dirname, '..', 'data', 'typographic-editions.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ORIGIN = 'https://axismaps.com';
const TILE_SIZE = 510;

function parseDzi(xml) {
  const size = /Width="(\d+)"/.exec(xml);
  const height = /Height="(\d+)"/.exec(xml);
  const tile = /TileSize="(\d+)"/.exec(xml);
  const format = /Format="(\w+)"/.exec(xml);
  if (!size || !height) return null;
  return {
    width: Number(size[1]),
    height: Number(height[1]),
    tileSize: tile ? Number(tile[1]) : null,
    format: format ? format[1] : null,
  };
}

/** DZI level N is the full-resolution level, where N = ceil(log2(max(w, h))). */
function maxLevel(width, height) {
  return Math.ceil(Math.log2(Math.max(width, height)));
}

function levelDims(width, height, level, max) {
  const scale = 2 ** (max - level);
  return { w: Math.ceil(width / scale), h: Math.ceil(height / scale) };
}

async function head(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Origin: ORIGIN, Range: 'bytes=0-0' },
    });
    return {
      ok: res.ok,
      status: res.status,
      type: res.headers.get('content-type'),
      cache: res.headers.get('cache-control'),
      cors: res.headers.get('access-control-allow-origin'),
    };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function verifyTiles(name, base, tilePath, problems) {
  const dziUrl = `${base}/${tilePath}`;
  let res;
  try {
    res = await fetch(dziUrl, { headers: { Origin: ORIGIN } });
  } catch (err) {
    problems.push(`${name}: .dzi unreachable — ${err.message}`);
    return null;
  }
  if (!res.ok) {
    problems.push(`${name}: .dzi returned ${res.status}`);
    return null;
  }

  const dzi = parseDzi(await res.text());
  if (!dzi) {
    problems.push(`${name}: .dzi did not parse`);
    return null;
  }
  if (dzi.tileSize !== TILE_SIZE) {
    problems.push(`${name}: tile size ${dzi.tileSize}, expected ${TILE_SIZE}`);
  }
  if (Math.max(dzi.width, dzi.height) < 4000) {
    problems.push(
      `${name}: only ${dzi.width}x${dzi.height} — too small for a deep zoom`
    );
  }

  const max = maxLevel(dzi.width, dzi.height);
  const filesBase = `${base}/${tilePath.replace(/\.dzi$/, '_files')}`;
  const ext = dzi.format === 'jpeg' ? 'jpeg' : dzi.format || 'jpeg';

  const deep = levelDims(dzi.width, dzi.height, max, max);
  const cols = Math.ceil(deep.w / TILE_SIZE);
  const rows = Math.ceil(deep.h / TILE_SIZE);

  const mid = Math.max(0, max - 3);
  const midDims = levelDims(dzi.width, dzi.height, mid, max);

  const checks = [
    [`L${max} first`, `${filesBase}/${max}/0_0.${ext}`],
    [`L${max} last`, `${filesBase}/${max}/${cols - 1}_${rows - 1}.${ext}`],
    [
      `L${max} centre`,
      `${filesBase}/${max}/${Math.floor(cols / 2)}_${Math.floor(rows / 2)}.${ext}`,
    ],
    [`L${mid}`, `${filesBase}/${mid}/0_0.${ext}`],
    [`L0`, `${filesBase}/0/0_0.${ext}`],
  ];

  for (const [what, url] of checks) {
    const r = await head(url);
    if (!r.ok) {
      problems.push(`${name}: ${what} missing (${r.status}${r.error ? ' ' + r.error : ''})`);
      continue;
    }
    if (r.type && !r.type.startsWith('image/')) {
      problems.push(`${name}: ${what} content-type is ${r.type}`);
    }
    if (r.cors !== '*' && r.cors !== ORIGIN) {
      problems.push(`${name}: ${what} not CORS-readable (ACAO: ${r.cors ?? 'none'})`);
    }
    if (!/max-age=\d{6,}/.test(r.cache || '')) {
      problems.push(`${name}: ${what} weak cache-control (${r.cache ?? 'none'})`);
    }
  }

  return {
    dims: `${dzi.width}x${dzi.height}`,
    levels: max + 1,
    deepest: `${cols}x${rows} tiles`,
    midLevel: `${midDims.w}x${midDims.h}px`,
  };
}

function verifyPhotos(name, photos, problems) {
  for (const src of photos) {
    const file = path.join(PUBLIC_DIR, src);
    if (!fs.existsSync(file)) problems.push(`${name}: missing photo ${src}`);
  }
  return { photos: photos.length };
}

async function main() {
  const base = (process.env.NEXT_PUBLIC_TILE_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    console.error('NEXT_PUBLIC_TILE_BASE_URL is not set.');
    process.exit(1);
  }

  const editions = JSON.parse(fs.readFileSync(EDITIONS, 'utf-8'));
  const problems = [];
  let tiled = 0;
  let photo = 0;
  let unpublished = 0;

  for (const [slug, list] of Object.entries(editions)) {
    for (const edition of list) {
      const name = `${slug}/${edition.id}`;
      if (edition.tilePath) {
        const info = await verifyTiles(name, base, edition.tilePath, problems);
        if (info) {
          tiled++;
          console.log(
            `✓ ${name.padEnd(34)} ${info.dims.padEnd(13)} ${String(info.levels).padStart(2)} levels · ${info.deepest}`
          );
        }
      } else if (edition.photos?.length) {
        const info = verifyPhotos(name, edition.photos, problems);
        photo++;
        console.log(`✓ ${name.padEnd(34)} ${info.photos} photographs`);
      } else {
        unpublished++;
        console.log(`· ${name.padEnd(34)} not published (source not readable)`);
      }
    }
  }

  console.log(
    `\n${tiled} tiled · ${photo} photographic · ${unpublished} unpublished`
  );

  if (problems.length) {
    console.error(`\n${problems.length} PROBLEM(S):`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log('All published editions resolve correctly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
