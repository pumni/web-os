"use client";

import React from "react";
import { Avatar, AvatarFallback, motion, useReducedMotion, recipes } from "@pumni/ui";
import type { Participant } from "../types";

interface ParticipantRailProps {
  participants: Participant[];
}

export function ParticipantRail({ participants }: ParticipantRailProps) {
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
        {participants.map((p) => (
          <motion.div
            key={p.userId}
            {...(shouldReduceMotion ? {} : recipes.staggerItem)}
            className="relative group"
          >
            <Avatar className="size-9 border border-border/40 ring-2 ring-background/50 hover:scale-105 transition-transform">
              <AvatarFallback className="text-xs font-medium uppercase select-none">
                {p.isHost ? "Host" : p.userId.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {p.isHost && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground shadow">
                ★
              </span>
            )}
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute bottom-11 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded border border-border shadow-md whitespace-nowrap">
              {p.isHost ? "Chủ phòng (Host)" : `User: ${p.userId}`}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
