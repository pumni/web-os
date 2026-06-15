import { z } from 'zod';

export const sourceTypeSchema = z.enum(['youtube', 'url']);

// YouTube: 11-char id. URL: http(s) only.
export const createRoomSchema = z.object({
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
});

export const setSourceSchema = z.object({
  roomId: z.uuid(),
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SetSourceInput = z.infer<typeof setSourceSchema>;

export const addQueueItemSchema = z.object({
  roomId: z.uuid(),
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
  title: z.string().max(300).optional(),
});

export const reorderQueueSchema = z.object({
  roomId: z.uuid(),
  itemId: z.uuid(),
  beforeId: z.uuid().nullable(),
  afterId: z.uuid().nullable(),
});

export const transferHostSchema = z.object({
  roomId: z.uuid(),
  newHostId: z.uuid(),
});

export type AddQueueItemInput = z.infer<typeof addQueueItemSchema>;
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;
export type TransferHostInput = z.infer<typeof transferHostSchema>;

export const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(500),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
