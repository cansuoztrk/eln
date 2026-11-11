/** Pulls the video id out of any common YouTube URL. Null when it is not one. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\.|^m\.|^music\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = parsed.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
      else {
        const match = /^\/(embed|shorts|live|v)\/([^/?#]+)/.exec(parsed.pathname);
        id = match ? match[2] : null;
      }
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Privacy-enhanced embed. Only ever mounted after the person presses play. */
export function youtubeEmbedUrl(id: string, autoplay = true): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1${autoplay ? "&autoplay=1" : ""}`;
}

/** Spotify track/album/playlist URL → its official embed URL. */
export function spotifyEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname !== "open.spotify.com") return null;
    const match = /^\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([A-Za-z0-9]{10,40})/.exec(parsed.pathname);
    return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
  } catch {
    return null;
  }
}
