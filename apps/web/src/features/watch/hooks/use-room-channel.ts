"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@pumni/supabase/browser";
import type { PlaybackAnchor, Participant, Room } from "../types";



export function useRoomChannel(
  room: Room,
  userId: string,
  isHost: boolean,
  onAnchor: (anchor: PlaybackAnchor) => void
) {
  const [currentRoom, setCurrentRoom] = useState<Room>(room);
  const [prevRoomId, setPrevRoomId] = useState<string>(room.id);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  if (room.id !== prevRoomId) {
    setPrevRoomId(room.id);
    setCurrentRoom(room);
  }


  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    // Create channel
    const channel = supabase.channel(`room:${room.id}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    // Listen to broadcast event
    channel.on(
      "broadcast",
      { event: "playback" },
      (payload: { payload: PlaybackAnchor }) => {
        if (payload.payload) {
          onAnchor(payload.payload);
        }
      }
    );

    // Listen to postgres changes for room updates (e.g. source change)
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "watch_rooms",
        filter: `id=eq.${room.id}`,
      },
      (payload) => {
        if (payload.new) {
          setCurrentRoom(payload.new as Room);
        }
      }
    );

    // Listen to presence events
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const list: Participant[] = [];
      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (Array.isArray(presences) && presences.length > 0) {
          // Take the latest presence for this user
          const latest = presences[presences.length - 1] as unknown as {
            presenceRef?: string;
            userId?: string;
            isHost?: boolean;
            joinedAt?: number;
          };
          list.push({
            presenceRef: latest.presenceRef,
            userId: latest.userId || key,
            isHost: !!latest.isHost,
            joinedAt: latest.joinedAt || Date.now(),
          });
        }
      });
      // Sort participants by joinedAt to keep order stable
      list.sort((a, b) => a.joinedAt - b.joinedAt);
      setParticipants(list);
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId,
          isHost,
          joinedAt: Date.now(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [room.id, userId, isHost, onAnchor]);

  const broadcastAnchor = useCallback((anchor: PlaybackAnchor) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "playback",
        payload: anchor,
      });
    }
  }, []);

  return {
    currentRoom,
    participants,
    broadcastAnchor,
  };
}


