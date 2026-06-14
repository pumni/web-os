"use client";

import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@pumni/supabase/browser";
import type { PlaybackAnchor, Participant, Room, QueueBroadcastEvent, ChatMessage, ReactionEvent } from "../types";
import { watchKeys } from "../query-keys";
import { getStructuralSignature } from "../sync-math";

export function useRoomChannel(
  room: Room,
  userId: string,
  isHost: boolean,
  onAnchor: (anchor: PlaybackAnchor) => void,
  onChat?: (m: ChatMessage) => void,
  onReaction?: (r: ReactionEvent) => void
) {
  const queryClient = useQueryClient();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [channelStatus, setChannelStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);

  const isHostRef = useRef(isHost);
  const joinedAtRef = useRef(0);
  const wasDisconnectedRef = useRef(false);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    joinedAtRef.current = Date.now();
  }, []);

  const lastSigRef = useRef<string>(getStructuralSignature(room));

  // Keep lastSigRef in sync when room data changes (e.g. from TanStack Query refetch)
  useEffect(() => {
    lastSigRef.current = getStructuralSignature(room);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.source_type, room.source_ref, room.host_id, room.current_queue_item_id]);

  const onAnchorLatestRef = useRef(onAnchor);
  useEffect(() => {
    onAnchorLatestRef.current = onAnchor;
  });

  const onChatLatestRef = useRef(onChat);
  const onReactionLatestRef = useRef(onReaction);
  useEffect(() => {
    onChatLatestRef.current = onChat;
  });
  useEffect(() => {
    onReactionLatestRef.current = onReaction;
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    // Create channel
    const activeChannel = supabase.channel(`room:${room.id}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = activeChannel;

    // 1. Listen to broadcast event (low-latency playback sync)
    activeChannel.on(
      "broadcast",
      { event: "playback" },
      (payload: { payload: PlaybackAnchor }) => {
        if (payload.payload) {
          onAnchorLatestRef.current(payload.payload);
        }
      }
    );

    // 2. Listen to postgres_changes for watch_rooms (structural signature change)
    activeChannel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "watch_rooms",
        filter: `id=eq.${room.id}`,
      },
      (payload) => {
        const newRoom = payload.new as Room;
        if (newRoom) {
          const newSig = getStructuralSignature(newRoom);
          if (newSig !== lastSigRef.current) {
            lastSigRef.current = newSig;
            void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
          }
        }
      }
    );

    // 3. Listen to broadcast event for queue changes
    activeChannel.on(
      "broadcast",
      { event: "queue" },
      (msg: { payload: QueueBroadcastEvent }) => {
        void queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
        const { action, title } = msg.payload ?? {};
        const name = title || "Không tên";
        if (action === "add") {
          toast.info(`Video "${name}" đã được thêm vào hàng chờ`);
        } else if (action === "remove") {
          toast.info(`Video "${name}" đã bị xóa khỏi hàng chờ`);
        } else if (action === "reorder") {
          toast.info("Thứ tự hàng chờ vừa được cập nhật");
        }
      }
    );

    activeChannel.on("broadcast", { event: "chat" }, (p: { payload: ChatMessage }) => {
      if (p.payload) onChatLatestRef.current?.(p.payload);
    });

    activeChannel.on("broadcast", { event: "reaction" }, (p: { payload: ReactionEvent }) => {
      if (p.payload) onReactionLatestRef.current?.(p.payload);
    });

    // 4. Listen to presence events
    activeChannel.on("presence", { event: "sync" }, () => {
      const state = activeChannel.presenceState();
      const list: Participant[] = [];
      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (Array.isArray(presences) && presences.length > 0) {
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
      list.sort((a, b) => a.joinedAt - b.joinedAt);
      setParticipants(list);
    });

    // Subscribe to channel
    activeChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setChannelStatus("connected");
        if (wasDisconnectedRef.current) {
          wasDisconnectedRef.current = false;
          void queryClient.invalidateQueries({ queryKey: watchKeys.room(room.id) });
          void queryClient.invalidateQueries({ queryKey: watchKeys.queue(room.id) });
        }
        await activeChannel.track({
          userId,
          isHost: isHostRef.current,
          joinedAt: joinedAtRef.current,
        });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        wasDisconnectedRef.current = true;
        setChannelStatus("disconnected");
      }
    });

    return () => {
      activeChannel.unsubscribe();
      channelRef.current = null;
    };
  }, [room.id, userId, queryClient]);

  // Re-track presence when host role flips WITHOUT tearing down the channel.
  useEffect(() => {
    const ch = channelRef.current;
    if (ch && ch.state === "joined") {
      void ch.track({ userId, isHost, joinedAt: joinedAtRef.current });
    }
  }, [isHost, userId]);

  const broadcastAnchor = (anchor: PlaybackAnchor) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "playback",
        payload: anchor,
      });
    }
  };

  const broadcastQueueEvent = (event: QueueBroadcastEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "queue",
        payload: event,
      });
    }
  };

  const broadcastChat = (m: ChatMessage) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat",
        payload: m,
      });
    }
  };

  const broadcastReaction = (r: ReactionEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "reaction",
        payload: r,
      });
    }
  };

  return {
    participants,
    broadcastAnchor,
    broadcastQueueEvent,
    channelStatus,
    broadcastChat,
    broadcastReaction,
  };
}
