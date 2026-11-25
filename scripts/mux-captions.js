#!/usr/bin/env node
// Turns on Mux's auto-generated English captions for the project films that
// play with sound. next-video has no setting for captions, so they are asked
// of Mux per asset, after `pnpm videos:sync` has uploaded it.
//
//   pnpm videos:captions             every film with a sidecar in videos/
//   pnpm videos:captions hpi eca     just these projects
//
// A film whose project sets `videoMuted: true` is skipped: its audio is only
// a music soundtrack, with nothing to caption. The script is safe to re-run.
// It asks only for films that have no generated captions yet, and for the
// rest it reports how far generation has got and the transcript's opening.
// "captions skipped" means Mux found no speech: the audio is a soundtrack, so
// set `videoMuted: true` on the project.
//
// Needs MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env.local, which the package
// script loads with --env-file (see .env.local.example for making a token).

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VIDEO_DIR = path.join(ROOT, "videos");
const POSTS_DIR = path.join(ROOT, "app", "projects", "posts");
const SIDECAR = /^(.+)\.(mp4|mov|m4v|webm)\.json$/;
const API = "https://api.mux.com/video/v1";
const CAPTIONS = { language_code: "en", name: "English (generated)" };
// Films whose speech is not English, which English captioning garbles. The
// Musqueam film's spoken words are hən̓q̓əmin̓əm̓ place names.
const NOT_ENGLISH = new Set(["musqueam"]);

const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = process.env;
if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error(
    "MUX_TOKEN_ID and MUX_TOKEN_SECRET are not set in .env.local. See .env.local.example.",
  );
  process.exit(1);
}
const AUTH = `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64")}`;

async function mux(method, endpoint, body) {
  const response = await fetch(`${API}${endpoint}`, {
    method,
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`${method} ${endpoint}: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).data;
}

function sidecars() {
  if (!fs.existsSync(VIDEO_DIR)) return [];
  return fs
    .readdirSync(VIDEO_DIR)
    .map((file) => ({ file, match: file.match(SIDECAR) }))
    .filter(({ match }) => match)
    .map(({ file, match }) => ({ slug: match[1], file: path.join(VIDEO_DIR, file) }));
}

// Read line by line, as app/lib/mdx.ts does: a YAML parser would reject
// some of the projects' frontmatter (unescaped quotes inside a value).
function isMuted(slug) {
  const post = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(post)) return false;
  // Anchored to the start, so a horizontal rule in the body can't pass for it.
  const frontmatter = fs.readFileSync(post, "utf-8").match(/^---\s*([\s\S]*?)\s*---/);
  return /^videoMuted:\s*true\s*$/m.test(frontmatter?.[1] ?? "");
}

async function transcriptOpening(playbackId, trackId) {
  const response = await fetch(`https://stream.mux.com/${playbackId}/text/${trackId}.txt`);
  if (!response.ok) return `(transcript unavailable: ${response.status})`;
  const text = (await response.text()).replace(/\s+/g, " ").trim();
  return text ? `"${text.slice(0, 100)}${text.length > 100 ? "…" : ""}"` : "(empty)";
}

async function caption({ slug, file }) {
  if (isMuted(slug)) {
    return `${slug}: skipped, videoMuted`;
  }
  if (NOT_ENGLISH.has(slug)) {
    return `${slug}: skipped, speech is not in English`;
  }

  const sidecar = JSON.parse(fs.readFileSync(file, "utf-8"));
  const { assetId, playbackId } = sidecar.providerMetadata?.mux ?? {};
  if (sidecar.status !== "ready" || !assetId) {
    return `${slug}: skipped, upload is ${sidecar.status} (run \`pnpm videos:sync\`)`;
  }

  const asset = await mux("GET", `/assets/${assetId}`);
  const tracks = asset.tracks ?? [];
  const generated = tracks.find(
    (track) => track.type === "text" && track.text_source === "generated_vod",
  );

  if (generated) {
    if (generated.status !== "ready") {
      return `${slug}: captions ${generated.status}`;
    }
    return `${slug}: captions ready ${await transcriptOpening(playbackId, generated.id)}`;
  }

  const audio =
    tracks.find((track) => track.type === "audio" && track.primary) ??
    tracks.find((track) => track.type === "audio");
  if (!audio) {
    return `${slug}: skipped, no audio track`;
  }

  await mux("POST", `/assets/${assetId}/tracks/${audio.id}/generate-subtitles`, {
    generated_subtitles: [CAPTIONS],
  });
  return `${slug}: captions requested`;
}

async function main() {
  const wanted = process.argv.slice(2);
  const all = sidecars();
  const films = wanted.length ? all.filter(({ slug }) => wanted.includes(slug)) : all;

  for (const slug of wanted) {
    if (!all.some((film) => film.slug === slug)) {
      console.warn(`${slug}: no sidecar in videos/`);
    }
  }

  let failed = false;
  for (const film of films) {
    try {
      console.log(await caption(film));
    } catch (error) {
      failed = true;
      console.error(`${film.slug}: ${error.message}`);
    }
  }
  if (failed) process.exitCode = 1;
}

main();
