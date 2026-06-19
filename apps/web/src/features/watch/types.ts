import type { Database } from '@pumni/supabase';

export type Room = Database['public']['Tables']['watch_rooms']['Row'];

export type PlaybackAnchor = {
  isPlaying: boolean;
  anchorPosition: number; // in seconds
  anchorServerTs: number; // in epoch ms server time
  playbackRate: number;
  sequence?: number;
  originSessionId?: string;
};

export type Participant = {
  presenceRef?: string;
  userId: string;
  isHost: boolean;
  joinedAt: number;
};

export type QueueItem = Database['public']['Tables']['watch_queue_items']['Row'];

/** Supabase `.select()` column list for queue items — shared between client hooks and server queries. */
export const QUEUE_ITEM_SELECT =
  'id, room_id, position, source_type, source_ref, title, added_by, created_at';

export interface QueueBroadcastEvent {
  action: 'add' | 'remove' | 'reorder' | 'advance';
  title?: string | null;
}

export interface RoomBroadcastEvent {
  action: 'source' | 'advance' | 'host-transfer' | 'host-claim' | 'queue-current-cleared';
}

export interface RoomRealtimeEvents {
  onAnchor: (handler: (anchor: PlaybackAnchor) => void) => () => void;
  onChat: (handler: (message: ChatMessage) => void) => () => void;
  onReaction: (handler: (reaction: ReactionEvent) => void) => () => void;
}

export interface ChatMessage {
  id: string; // crypto.randomUUID() phía client gửi
  userId: string;
  text: string;
  sentAt: number; // Date.now() của người gửi
}

export interface ReactionEvent {
  id: string;
  userId: string;
  emoji: string; // 1 trong tập cho phép
  sentAt: number;
}
