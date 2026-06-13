import "server-only";

import { serverEnv } from "@pumni/env/server";
import type {
  JellyfinAuthResult,
  JellyfinItem,
  JellyfinLibraryResult,
  JellyfinPlaybackInfo,
  JellyfinStreamingToken,
} from "./types";

const DEVICE_ID = "pumni-web-os-server";
const CLIENT_NAME = "Pumni Web OS";
const CLIENT_VERSION = "1.0.0";

/**
 * Admin authorization headers. SERVER-ONLY — the embedded API key is the
 * full-privilege Jellyfin token and must never reach the browser. Used for
 * library browsing and minting the low-privilege streaming token.
 */
export function getJellyfinAuthHeaders(): Record<string, string> {
  return {
    "X-MediaBrowser-Token": serverEnv.JELLYFIN_API_KEY,
    Authorization: `MediaBrowser Client="${CLIENT_NAME}", Device="PumniServer", DeviceId="${DEVICE_ID}", Version="${CLIENT_VERSION}", Token="${serverEnv.JELLYFIN_API_KEY}"`,
    "Content-Type": "application/json",
  };
}

export async function fetchJellyfin<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${serverEnv.JELLYFIN_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getJellyfinAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Jellyfin API error (${response.status}): ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Normalize a 32-char Jellyfin id into dashed UUID form. Jellyfin accepts both,
 * but several endpoints are stricter, so we dash consistently. Single source of
 * truth — do not re-implement at call sites.
 */
export function toDashedUuid(id: string): string {
  if (id.includes("-")) return id;
  if (id.length === 32) {
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
  }
  return id;
}

// --- Low-privilege streaming token (handed to the browser player) ----------

let cachedToken: (JellyfinStreamingToken & { expiresAt: number }) | null = null;
// Jellyfin access tokens are long-lived; re-auth hourly to stay fresh.
const TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Authenticate as the dedicated low-privilege Jellyfin user and return a scoped
 * AccessToken + that user's id. This token — NOT the admin API key — is the only
 * Jellyfin credential allowed to reach the browser (used to build direct HLS
 * URLs against `NEXT_PUBLIC_JELLYFIN_URL`). Cached in-process with a TTL.
 */
export async function getStreamingToken(): Promise<JellyfinStreamingToken> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return { accessToken: cachedToken.accessToken, userId: cachedToken.userId };
  }

  const response = await fetch(`${serverEnv.JELLYFIN_URL}/Users/AuthenticateByName`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `MediaBrowser Client="${CLIENT_NAME}", Device="PumniBrowser", DeviceId="pumni-web-os-browser", Version="${CLIENT_VERSION}"`,
    },
    body: JSON.stringify({
      Username: serverEnv.JELLYFIN_USER,
      Pw: serverEnv.JELLYFIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Jellyfin auth failed (${response.status}): ${response.statusText}`);
  }

  const data = (await response.json()) as JellyfinAuthResult;
  cachedToken = {
    accessToken: data.AccessToken,
    userId: data.User.Id,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return { accessToken: data.AccessToken, userId: data.User.Id };
}

/**
 * The Jellyfin user id all server-side library queries run as — the dedicated
 * streaming user (not an arbitrary `users[0]`).
 */
export async function getJellyfinUserId(): Promise<string> {
  const { userId } = await getStreamingToken();
  return userId;
}

// --- Library queries (server-side, small JSON — bandwidth-safe) -------------

export async function getMediaItems(options: {
  type?: "Movie" | "Series";
  limit?: number;
  startIndex?: number;
  searchTerm?: string;
  sortBy?: string[];
  sortOrder?: string[];
}): Promise<JellyfinLibraryResult> {
  const userId = await getJellyfinUserId();
  const params = new URLSearchParams();
  params.append("Recursive", "true");
  params.append("UserId", userId);

  if (options.type) {
    params.append("IncludeItemTypes", options.type);
  } else {
    params.append("IncludeItemTypes", "Movie,Series");
  }

  if (options.limit !== undefined) params.append("Limit", options.limit.toString());
  if (options.startIndex !== undefined) params.append("StartIndex", options.startIndex.toString());
  if (options.searchTerm) params.append("SearchTerm", options.searchTerm);

  const sortBy = options.sortBy ?? ["DateCreated"];
  sortBy.forEach((field) => params.append("SortBy", field));

  const sortOrder = options.sortOrder ?? ["Descending"];
  sortOrder.forEach((order) => params.append("SortOrder", order));

  // Retrieve basic details to display
  params.append("Fields", "Overview,Genres,CommunityRating,RunTimeTicks,ProductionYear");

  return fetchJellyfin<JellyfinLibraryResult>(`/Items?${params.toString()}`);
}

export async function getMediaItemDetail(itemId: string): Promise<JellyfinItem> {
  const userId = await getJellyfinUserId();
  return fetchJellyfin<JellyfinItem>(`/Users/${userId}/Items/${toDashedUuid(itemId)}`);
}

export async function getPlaybackInfo(itemId: string): Promise<JellyfinPlaybackInfo> {
  const userId = await getJellyfinUserId();
  return fetchJellyfin<JellyfinPlaybackInfo>(
    `/Items/${toDashedUuid(itemId)}/PlaybackInfo?userId=${userId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }
  );
}

export async function isJellyfinServerOnline(): Promise<boolean> {
  try {
    const response = await fetch(`${serverEnv.JELLYFIN_URL}/System/Info/Public`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
