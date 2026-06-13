import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMediaDetail, getMediaFavorites, MediaDetail } from "@/features/media";

interface PageProps {
  params: Promise<{
    itemId: string;
  }>;
}

export const unstable_instant = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { itemId } = await params;
    const item = await getMediaDetail(itemId);
    if (!item) {
      return {
        title: "Chi tiết phim - Cinema",
      };
    }
    return {
      title: `${item.Name} - Cinema`,
      description: item.Overview || "Chi tiết phim trên Pumni Cinema",
    };
  } catch {
    return {
      title: "Chi tiết phim - Cinema",
    };
  }
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { itemId } = await params;

  const item = await getMediaDetail(itemId);
  if (!item) {
    notFound();
  }

  const favorites = await getMediaFavorites();
  const isFavorite = favorites.some((f) => f.jellyfin_item_id === itemId);

  return <MediaDetail item={item} isFavorite={isFavorite} />;
}
