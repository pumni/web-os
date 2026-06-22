'use client';

import React from 'react';
import { Button } from '@pumni/ui/form';
import { SmilePlus } from 'lucide-react';

interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

const EMOJIS = ['❤️', '😂', '😮', '👍', '🎉'];

export function ReactionBar({ onReact }: ReactionBarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleReact = (emoji: string) => {
    onReact(emoji);
    setIsOpen(false);
  };

  return (
    <div
      className="group relative flex justify-end select-none"
      data-open={isOpen}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <div className="pointer-events-none absolute right-0 bottom-full z-popover mb-2 flex origin-bottom translate-y-2 scale-95 flex-col-reverse items-center gap-1 rounded-full border border-border bg-popover p-1 text-popover-foreground opacity-0 shadow-raised transition-[opacity,transform] duration-(--duration-fast) ease-snappy group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-data-[open=true]:pointer-events-auto group-data-[open=true]:translate-y-0 group-data-[open=true]:scale-100 group-data-[open=true]:opacity-100 motion-safe:will-change-[opacity,transform]">
        {EMOJIS.map((emoji) => (
          <Button
            key={emoji}
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleReact(emoji)}
            className="rounded-full text-lg motion-safe:transition-transform motion-safe:duration-(--duration-fast) motion-safe:ease-snappy motion-safe:hover:-translate-y-0.5"
            aria-label={`Thả cảm xúc ${emoji}`}
          >
            {emoji}
          </Button>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="icon"
        pressable={false}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Mở cảm xúc"
        aria-expanded={isOpen}
        className="size-9 rounded-full"
      >
        <SmilePlus className="size-4" />
      </Button>
    </div>
  );
}
