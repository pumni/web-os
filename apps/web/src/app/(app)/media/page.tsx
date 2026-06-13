import type { Metadata } from "next";
import { getMediaLibrary, getResumeWatching, getMediaFavorites, MediaLibrary } from "@/features/media";
import { isJellyfinServerOnline } from "@pumni/jellyfin";
import { serverEnv } from "@pumni/env/server";

export const metadata: Metadata = {
  title: "Cinema - Pumni Web OS",
  description: "Duyệt và phát trực tuyến các bộ phim từ máy chủ Jellyfin của bạn.",
};

export default async function MediaPage() {
  const items = await getMediaLibrary();
  const resumeItems = await getResumeWatching();
  const favorites = await getMediaFavorites();
  const isJellyfinOnline = await isJellyfinServerOnline();
  // Public Tailscale base the browser probes directly for its own connectivity check.
  const jellyfinUrl = serverEnv.NEXT_PUBLIC_JELLYFIN_URL;

  return (
    <MediaLibrary
      items={items.Items}
      resumeItems={resumeItems}
      favorites={favorites}
      isJellyfinOnline={isJellyfinOnline}
      jellyfinUrl={jellyfinUrl}
    />
  );
}

