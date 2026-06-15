'use client';

import React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  motion,
  useReducedMotion,
  recipes,
  cn,
} from '@pumni/ui';
import { Crown } from 'lucide-react';
import type { Participant } from '../types';

interface ParticipantRailProps {
  participants: Participant[];
  profiles?: Record<string, { username: string | null; avatar_url: string | null }>;
}

export function ParticipantRail({ participants, profiles = {} }: ParticipantRailProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted-foreground select-none">
        Người tham gia ({participants.length})
      </span>
      <motion.div
        {...(shouldReduceMotion ? {} : recipes.staggerContainer)}
        className="flex flex-wrap gap-2 items-center"
      >
        {participants.map((p) => {
          const profile = profiles[p.userId];
          const displayName = profile?.username ?? `User: ${p.userId.slice(0, 8)}`;
          const initials = profile?.username
            ? profile.username.slice(0, 2)
            : p.isHost
              ? 'Ho'
              : p.userId.slice(0, 2);

          return (
            <motion.div
              key={p.userId}
              {...(shouldReduceMotion ? {} : recipes.staggerItem)}
              className="relative group"
            >
              <Avatar
                className={cn(
                  'size-9 border ring-2 ring-background motion-safe:hover:scale-110 transition-transform duration-(--duration-fast) ease-snappy',
                  p.isHost ? 'border-primary/40 ring-primary/20' : 'border-border',
                )}
              >
                {profile?.avatar_url && (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={displayName}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-xs font-semibold uppercase select-none">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {p.isHost && (
                <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                  <Crown className="size-2.5 fill-current" />
                </span>
              )}
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-11 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-(--duration-fast) bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md border border-border shadow-md whitespace-nowrap">
                {p.isHost ? `Chủ phòng (${displayName})` : displayName}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
