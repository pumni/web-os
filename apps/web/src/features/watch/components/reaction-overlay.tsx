'use client';

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import type { ReactionEvent } from '../types';

export interface ReactionOverlayRef {
  pushReaction: (reaction: ReactionEvent) => void;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number; // horizontal offset percentage
}

interface ReactionOverlayProps {
  className?: string;
}

export const ReactionOverlay = forwardRef<ReactionOverlayRef, ReactionOverlayProps>(
  ({ className }, ref) => {
    const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

    useImperativeHandle(ref, () => ({
      pushReaction(reaction) {
        const id = reaction.id;
        const emoji = reaction.emoji;
        const left = Math.random() * 80 + 10; // Random horizontal position between 10% and 90%

        setEmojis((prev) => [...prev, { id, emoji, left }]);

        // Auto-remove after 2.5 seconds (matches animation duration)
        setTimeout(() => {
          setEmojis((prev) => prev.filter((item) => item.id !== id));
        }, 2500);
      },
    }));

    return (
      <div
        className={`reaction-overlay pointer-events-none absolute inset-0 overflow-hidden select-none ${className ?? ''}`}
        aria-hidden="true"
      >
        {emojis.map((item) => (
          <span
            key={item.id}
            className="reaction-fly absolute bottom-4 text-2xl"
            style={{ left: `${item.left}%` }}
          >
            {item.emoji}
          </span>
        ))}
      </div>
    );
  },
);

ReactionOverlay.displayName = 'ReactionOverlay';
