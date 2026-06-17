'use client';

import React from 'react';
import { Button, GlassSurface, recipes, motion, useReducedMotion } from '@pumni/ui';

interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

const EMOJIS = ['❤️', '😂', '😮', '👍', '🎉'];

export function ReactionBar({ onReact }: ReactionBarProps) {
  const shouldReduceMotion = useReducedMotion();

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
          className="size-8 p-0 text-lg motion-safe:hover:bg-muted/80 rounded-full"
          aria-label={`Thả cảm xúc ${emoji}`}
          asChild
        >
          <motion.button
            {...(shouldReduceMotion ? {} : recipes.pressScale)}
            className="size-8 flex items-center justify-center rounded-full"
          >
            {emoji}
          </motion.button>
        </Button>
      ))}
    </GlassSurface>
  );
}
