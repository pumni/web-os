import { z } from "zod";

export const sourceTypeSchema = z.enum(["youtube", "url"]);

// YouTube: 11-char id. URL: http(s) only.
export const createRoomSchema = z.object({
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
});

export const setSourceSchema = z.object({
  roomId: z.string().uuid(),
  sourceType: sourceTypeSchema,
  sourceRef: z.string().min(1).max(2048),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SetSourceInput = z.infer<typeof setSourceSchema>;
