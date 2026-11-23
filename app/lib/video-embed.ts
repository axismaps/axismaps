// How a project's videoUrl is embedded: the player address, what the iframe
// may do, and the message that pauses it. The pause message is what lets the
// carousel stop a video it has scrolled out of sight, since a hidden slide
// stays mounted and would otherwise keep playing.
export type VideoEmbed = {
  src: string;
  allow: string;
  origin: string;
  pauseMessage: string;
};

const VIMEO_HOSTS = new Set(["vimeo.com", "player.vimeo.com"]);
const YOUTUBE_HOSTS = new Set(["youtube.com", "m.youtube.com", "youtu.be"]);
// Vimeo's privacy hashes run to about ten hex digits; the minimum keeps a
// short path segment that happens to be hex from being taken for one.
const VIMEO_HASH = /^[0-9a-f]{6,}$/i;
const YOUTUBE_ID = /^[\w-]{6,}$/;

export function videoEmbed(url: string): VideoEmbed | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (VIMEO_HOSTS.has(host)) {
    // The id is the first all-digit segment, which also covers channel and
    // showcase addresses and an existing player address. An unlisted video
    // carries a hash after it, and only embeds when the hash is passed on.
    const at = segments.findIndex((segment) => /^\d+$/.test(segment));
    if (at === -1) return null;
    const next = segments[at + 1];
    const query = parsed.searchParams.get("h");
    const hash = [next, query].find((value) => value && VIMEO_HASH.test(value));

    // The title, owner and avatar Vimeo lays over the top-left corner would
    // otherwise cover each film's opening frame. Hiding them in Vimeo's own
    // settings needs a paid plan; these parameters do not.
    const params = new URLSearchParams({
      title: "0",
      byline: "0",
      portrait: "0",
    });
    if (hash) params.set("h", hash);

    return {
      src: `https://player.vimeo.com/video/${segments[at]}?${params}`,
      allow: "autoplay; fullscreen; picture-in-picture",
      origin: "https://player.vimeo.com",
      // Vimeo's player listens for these without any opt-in.
      pauseMessage: JSON.stringify({ method: "pause" }),
    };
  }

  if (YOUTUBE_HOSTS.has(host)) {
    const id =
      host === "youtu.be"
        ? segments[0]
        : segments[0] === "watch"
          ? parsed.searchParams.get("v")
          : segments[0] === "embed" || segments[0] === "shorts"
            ? segments[1]
            : null;
    // The id lands in the player address as it is, so anything beyond the
    // characters YouTube uses (a decoded "&autoplay=1", say) is refused.
    if (!id || !YOUTUBE_ID.test(id)) return null;

    return {
      // YouTube ignores player commands unless the embed opts in.
      src: `https://www.youtube.com/embed/${id}?enablejsapi=1`,
      allow:
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      origin: "https://www.youtube.com",
      pauseMessage: JSON.stringify({
        event: "command",
        func: "pauseVideo",
        args: [],
      }),
    };
  }

  return null;
}
