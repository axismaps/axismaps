import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { isReadyMuxAsset } from '../lib/video-asset';

// Checks the committed video sidecars themselves rather than the code that
// reads them. A sidecar committed before its upload finished, or named for a
// project that does not exist, would quietly leave a project without its
// film, so it fails here instead.
const root = process.cwd();
const videoDir = path.join(root, 'videos');
const postsDir = path.join(root, 'app', 'projects', 'posts');
const SIDECAR = /^(.+)\.(mp4|mov|m4v|webm)\.json$/;

const sidecars = fs.existsSync(videoDir)
  ? fs.readdirSync(videoDir).filter((file) => file.endsWith('.json'))
  : [];

describe('video sidecars', () => {
  it.each(sidecars)('%s is named videos/{slug}.{ext}.json', (file) => {
    expect(file).toMatch(SIDECAR);
  });

  it.each(sidecars)('%s belongs to a project', (file) => {
    const slug = file.match(SIDECAR)?.[1];
    expect(fs.existsSync(path.join(postsDir, `${slug}.mdx`))).toBe(true);
  });

  it.each(sidecars)('%s is a finished Mux upload', (file) => {
    const asset = JSON.parse(fs.readFileSync(path.join(videoDir, file), 'utf-8'));
    // Commit a sidecar only once `pnpm videos:sync` reports it ready.
    expect(asset.status).toBe('ready');
    expect(asset.provider).toBe('mux');
    expect(isReadyMuxAsset(asset)).toBe(true);
  });

  // getHomepageFilms takes the newer of two flagged projects without a word,
  // so a second flag added by mistake is caught here.
  it('flags at most one project to lead the homepage films', () => {
    const flagged = fs
      .readdirSync(postsDir)
      .filter((file) => file.endsWith('.mdx'))
      .filter((file) =>
        /^homepageVideo:\s*true\s*$/m.test(
          fs.readFileSync(path.join(postsDir, file), 'utf-8').split(/^---\s*$/m)[1] ?? '',
        ),
      );
    expect(flagged.length).toBeLessThanOrEqual(1);
  });

  it('holds at most one sidecar per project', () => {
    const slugs = sidecars.map((file) => file.match(SIDECAR)?.[1]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('projects with a Mux film', () => {
  // The sidecar leads the hero, so a videoUrl left beside it would never
  // play: it is a stale Vimeo or YouTube address waiting to mislead.
  const slugs = sidecars.map((file) => file.match(SIDECAR)?.[1]);

  it.each(slugs)('%s has no videoUrl beside its sidecar', (slug) => {
    const post = fs.readFileSync(path.join(postsDir, `${slug}.mdx`), 'utf-8');
    expect(post).not.toMatch(/^videoUrl:/m);
  });

  // ProjectVideo names the film in Mux Data with the project title, so a
  // project without one would file its film's views under "[No Value]".
  it.each(slugs)('%s has a title to name its film in Mux Data', (slug) => {
    const post = fs.readFileSync(path.join(postsDir, `${slug}.mdx`), 'utf-8');
    const frontmatter = post.split(/^---\s*$/m)[1] ?? '';
    const title = frontmatter
      .match(/^title:\s*(.*)$/m)?.[1]
      .trim()
      .replace(/^(["'])(.*)\1$/, '$2')
      .trim();
    expect(title).toBeTruthy();
  });
});
