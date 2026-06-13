"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@pumni/ui";
import { Star } from "lucide-react";
import type { Route } from "next";
import type { JellyfinItem } from "../types";

interface MediaCardProps {
  item: JellyfinItem;
  progress?: {
    positionTicks: number;
    runtimeTicks: number;
  };
}

export function MediaCard({ item, progress }: MediaCardProps) {
  const imageUrl = `/api/media/image/${item.Id}?fillWidth=300&fillHeight=450&quality=90`;
  const rating = item.CommunityRating ? item.CommunityRating.toFixed(1) : null;
  const year = item.ProductionYear;

  const percentComplete =
    progress && progress.runtimeTicks > 0
      ? Math.round((progress.positionTicks / progress.runtimeTicks) * 100)
      : 0;

  return (
    <Card
      variant="glass"
      interactive
      className="group relative overflow-hidden p-0 rounded-xl aspect-[2/3] flex flex-col justify-end min-h-[260px]"
    >
      <Link href={`/media/${item.Id}` as Route} className="absolute inset-0 z-10" />

      {/* Background Poster Image */}
      <div className="absolute inset-0 w-full h-full">
        {item.ImageTags?.Primary ? (
          <Image
            src={imageUrl}
            alt={item.Name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-fluid group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground p-4 text-center font-medium text-sm">
            {item.Name}
          </div>
        )}
      </div>

      {/* Scrim Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-80 transition-opacity group-hover:opacity-90"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)",
        }}
      />

      {/* Media Details */}
      <div className="relative z-10 p-4 w-full flex flex-col gap-1 text-primary-foreground">
        <h3 className="font-semibold text-sm line-clamp-2 leading-tight tracking-tight group-hover:text-primary transition-colors">
          {item.Name}
        </h3>

        <div className="flex items-center gap-2 text-xs text-primary-foreground/60">
          {year && <span>{year}</span>}
          {year && rating && <span className="size-1 rounded-full bg-primary-foreground/20" />}
          {rating && (
            <div className="flex items-center gap-0.5 text-warning">
              <Star className="size-3 fill-current" />
              <span>{rating}</span>
            </div>
          )}
          {item.Type && (
            <span className="ml-auto uppercase text-[9px] tracking-wider bg-primary-foreground/10 px-1.5 py-0.5 rounded-sm">
              {item.Type === "Movie" ? "Phim" : "Series"}
            </span>
          )}
        </div>
      </div>

      {/* Resume Progress Bar */}
      {percentComplete > 0 && percentComplete < 90 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/20 z-20">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      )}
    </Card>
  );
}
