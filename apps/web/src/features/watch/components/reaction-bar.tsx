"use client";

import React from "react";
import { Button, GlassSurface } from "@pumni/ui";

interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

const EMOJIS = ["❤️", "😂", "😮", "👍", "🎉"];

export function ReactionBar({ onReact }: ReactionBarProps) {
  return (
    <GlassSurface
      variant="panel"
      radius="full"
      className="flex items-center gap-1.5 px-3 py-1.5 select-none w-fit"
    >
      {EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          onClick={() => onReact(emoji)}
          className="size-8 p-0 text-lg motion-safe:hover:bg-muted/80 hover:scale-125 transition-transform duration-(--duration-fast) active:scale-95 rounded-full"
          aria-label={`Thả cảm xúc ${emoji}`}
        >
          {emoji}
        </Button>
      ))}
    </GlassSurface>
  );
}
