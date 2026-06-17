'use client';

import React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  motion,
  useReducedMotion,
  recipes,
  cn,
} from '@pumni/ui';
import { Crown } from 'lucide-react';
import type { Participant } from '../types';

type ParticipantProfile = { username: string | null; avatar_url: string | null };

interface ParticipantPanelProps {
  participants: Participant[];
  profiles?: Record<string, ParticipantProfile>;
  isHost?: boolean;
  userId?: string;
  onTransferHost?: (newHostId: string) => void;
  isPending?: boolean;
}

// fallow-ignore-next-line complexity
function getParticipantDisplay(
  p: Participant,
  profile: ParticipantProfile | undefined,
  isCurrentUser: boolean,
): { displayName: string; initials: string } {
  const displayName =
    profile?.username ?? (isCurrentUser ? 'Bạn' : `User: ${p.userId.slice(0, 8)}`);
  const initials = profile?.username
    ? profile.username.slice(0, 2)
    : p.isHost
      ? 'Ho'
      : p.userId.slice(0, 2);
  return { displayName, initials };
}

interface ParticipantRowProps {
  participant: Participant;
  profile?: ParticipantProfile;
  isCurrentUser: boolean;
  shouldReduceMotion: boolean | null;
}

// fallow-ignore-next-line complexity
function ParticipantRow({
  participant: p,
  profile,
  isCurrentUser,
  shouldReduceMotion,
}: ParticipantRowProps) {
  const { displayName, initials } = getParticipantDisplay(p, profile, isCurrentUser);
  const isHost = p.isHost;

  const rowClass = cn(
    'flex items-center justify-between p-2 rounded-md border text-xs transition-colors duration-(--duration-fast)',
    isHost
      ? 'border-primary/20 bg-primary/10'
      : 'border-border bg-muted motion-safe:hover:bg-muted/80',
  );
  const avatarClass = cn(
    'size-7 border shrink-0',
    isHost ? 'border-primary/40 ring-2 ring-primary/20' : 'border-border',
  );
  const fallbackClass = cn(
    'text-[10px] font-bold uppercase select-none',
    isHost ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
  );
  const label = isCurrentUser && profile?.username ? `${displayName} (Bạn)` : displayName;

  return (
    <motion.div
      {...(shouldReduceMotion ? {} : recipes.staggerItem)}
      className={rowClass}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className={avatarClass}>
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={displayName} className="object-cover" />
          )}
          <AvatarFallback className={fallbackClass}>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="truncate font-medium text-foreground">{label}</span>
          {isHost && (
            <span className="type-caption flex items-center gap-0.5 mt-0.5 text-primary font-medium">
              <Crown className="size-2.5 fill-current" />
              Chủ phòng
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ParticipantRail({
  participants,
  profiles = {},
  isHost = false,
  userId,
  onTransferHost,
  isPending = false,
}: ParticipantPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      {...(shouldReduceMotion ? {} : recipes.staggerContainer)}
      className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0"
    >
      {participants.map((p) => {
        const profile = profiles[p.userId];
        const isCurrentUser = p.userId === userId;
        const { displayName } = getParticipantDisplay(p, profile, isCurrentUser);
        const canTransfer = isHost && !p.isHost;

        const row = (
          <ParticipantRow
            participant={p}
            profile={profile}
            isCurrentUser={isCurrentUser}
            shouldReduceMotion={shouldReduceMotion}
          />
        );

        if (canTransfer && onTransferHost) {
          return (
            <ContextMenu key={p.userId}>
              <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem
                  disabled={isPending}
                  onClick={() => onTransferHost(p.userId)}
                  className="text-xs gap-2"
                >
                  <Crown className="size-3.5" />
                  Chuyển quyền chủ phòng
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        }

        return (
          <Tooltip key={p.userId}>
            <TooltipTrigger asChild>
              <div className="contents">{row}</div>
            </TooltipTrigger>
            <TooltipContent>
              {p.isHost ? `Chủ phòng (${displayName})` : displayName}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </motion.div>
  );
}