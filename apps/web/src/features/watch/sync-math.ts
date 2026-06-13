import type { PlaybackAnchor } from "./types";

/**
 * Calculates where the playback head should be right now on the server timeline.
 */
export function calculateExpectedPosition(anchor: PlaybackAnchor, serverNowMs: number): number {
  let expected = anchor.anchorPosition;
  if (anchor.isPlaying) {
    expected += ((serverNowMs - anchor.anchorServerTs) / 1000) * anchor.playbackRate;
  }
  return expected;
}

/**
 * Extracts the 11-character video ID from a YouTube link or ID.
 */
export function extractYouTubeId(urlOrId: string): string | null {
  const ytIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  if (ytIdPattern.test(urlOrId)) return urlOrId;

  try {
    const urlObj = new URL(urlOrId);
    if (urlObj.hostname === "youtu.be") {
      const id = urlObj.pathname.slice(1);
      if (ytIdPattern.test(id)) return id;
    } else if (urlObj.hostname.includes("youtube.com")) {
      if (urlObj.pathname === "/watch") {
        const id = urlObj.searchParams.get("v");
        if (id && ytIdPattern.test(id)) return id;
      } else if (urlObj.pathname.startsWith("/embed/")) {
        const id = urlObj.pathname.split("/")[2];
        if (id && ytIdPattern.test(id)) return id;
      }
    }
  } catch {
    // ignore parsing errors
  }
  return null;
}

/**
 * Validates if a string is a valid http or https URL.
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
