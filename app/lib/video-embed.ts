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

export function videoEmbed(url: string): VideoEmbed | null {
  if (url.includes("vimeo")) {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1] || url.split("/").pop();
    return {
      // The title, owner and avatar Vimeo lays over the top-left corner would
      // otherwise cover each film's opening frame. Hiding them in Vimeo's own
      // settings needs a paid plan; these parameters do not.
      src: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
      allow: "autoplay; fullscreen; picture-in-picture",
      origin: "https://player.vimeo.com",
      // Vimeo's player listens for these without any opt-in.
      pauseMessage: JSON.stringify({ method: "pause" }),
    };
  }

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.includes("youtube.com")
      ? url.split("v=")[1]?.split("&")[0]
      : url.split("/").pop()?.split("?")[0];
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
