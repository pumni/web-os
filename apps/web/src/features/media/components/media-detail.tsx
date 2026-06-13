"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Card } from "@pumni/ui";
import { ArrowLeft, Play, Heart, Star, Clock, Calendar } from "lucide-react";
import { toggleFavorite } from "../actions";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { JellyfinItem } from "../types";

interface MediaDetailProps {
  item: JellyfinItem;
  isFavorite: boolean;
}

export function MediaDetail({ item, isFavorite }: MediaDetailProps) {
  const router = useRouter();
  const [favorite, setFavorite] = React.useState(isFavorite);
  const [isPending, startTransition] = React.useTransition();

  const handleFavoriteToggle = () => {
    startTransition(async () => {
      // Optimistic update
      setFavorite((prev) => !prev);
      const res = await toggleFavorite({
        itemId: item.Id,
        title: item.Name,
        mediaType: item.Type === "Series" ? "Series" : "Movie",
      });
      if (!res.ok) {
        // Rollback
        setFavorite((prev) => !prev);
      } else {
        router.refresh();
      }
    });
  };

  const runtimeMinutes = item.RunTimeTicks
    ? Math.round(item.RunTimeTicks / 10000000 / 60)
    : null;

  const rating = item.CommunityRating ? item.CommunityRating.toFixed(1) : null;
  const posterUrl = `/api/media/image/${item.Id}?type=Primary&fillWidth=400&fillHeight=600&quality=95`;
  const backdropUrl = `/api/media/image/${item.Id}?type=Backdrop&fillWidth=1280&fillHeight=720&quality=80`;

  return (
    <div className="relative min-h-screen w-full text-foreground pb-12">
      {/* Background Backdrop Banner */}
      {item.ImageTags?.Backdrop && (
        <div className="absolute top-0 left-0 right-0 h-[60vh] md:h-[70vh] z-0 overflow-hidden">
          <Image
            src={backdropUrl}
            alt={item.Name}
            fill
            priority
            unoptimized
            className="object-cover opacity-25 blur-xs"
          />
          {/* Bottom Fade to black/transparent */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      )}

      {/* Detail Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 pt-6 flex flex-col gap-6">
        {/* Back navigation */}
        <Link href={"/media" as Route} className="w-fit">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Quay lại thư viện
          </Button>
        </Link>

        {/* Media Info Layout */}
        <div className="flex flex-col md:flex-row gap-8 md:items-start mt-4">
          {/* Left: Poster */}
          <div className="w-full max-w-[280px] mx-auto md:mx-0 shrink-0 aspect-[2/3] relative rounded-2xl overflow-hidden shadow-2xl border border-border/40">
            {item.ImageTags?.Primary ? (
              <Image
                src={posterUrl}
                alt={item.Name}
                fill
                priority
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-semibold">
                {item.Name}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              {item.Type && (
                <span className="w-fit text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary px-2.5 py-1 rounded-full">
                  {item.Type === "Movie" ? "Phim Điện Ảnh" : "Phim Bộ / Series"}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-none text-foreground">
                {item.Name}
              </h1>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                {item.ProductionYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-4" /> {item.ProductionYear}
                  </span>
                )}
                {runtimeMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-4" /> {runtimeMinutes} phút
                  </span>
                )}
                {rating && (
                  <span className="flex items-center gap-1 text-warning font-medium">
                    <Star className="size-4 fill-current" /> {rating} / 10
                  </span>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/media/${item.Id}/watch` as Route}>
                <Button size="lg" className="gap-2 font-medium px-6 shadow-lg hover:shadow-primary/25">
                  <Play className="size-5 fill-current" /> Phát Video
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteToggle}
                disabled={isPending}
                className={`size-11 rounded-full border border-border/80 ${
                  favorite
                    ? "text-destructive hover:text-destructive/80 bg-destructive/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Yêu thích"
              >
                <Heart className={`size-5 ${favorite ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Overview / Genres */}
            <Card variant="glass" className="p-6 flex flex-col gap-4">
              {item.Genres && item.Genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.Genres.map((genre) => (
                    <span
                      key={genre}
                      className="text-xs bg-muted/60 text-muted-foreground border border-border/40 px-2.5 py-1 rounded-md"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {item.Overview && (
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-foreground text-sm">Tóm tắt nội dung</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                    {item.Overview}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
