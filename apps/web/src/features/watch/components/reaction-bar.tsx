"use client";

import React from "react";
import { Button } from "@pumni/ui";

interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

const EMOJIS = ["❤️", "😂", "😮", "👍", "🎉"];

export function ReactionBar({ onReact }: ReactionBarProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/10 bg-background/25 backdrop-blur-md shadow-lg select-none w-fit">
      {EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          onClick={() => onReact(emoji)}
          className="size-8 p-0 text-lg hover:bg-background/40 hover:scale-125 transition-transform duration-200 active:scale-95 rounded-full"
          aria-label={`Thả cảm xúc ${emoji}`}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
}
