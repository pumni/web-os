import { z } from "zod";

export const mediaItemIdSchema = z
  .string()
  .regex(/^[a-f0-9]{32}$/i, "Invalid Media ID format");

export const reportProgressSchema = z.object({
  itemId: mediaItemIdSchema,
  positionTicks: z.number().int().nonnegative(),
  runtimeTicks: z.number().int().nonnegative(),
  title: z.string().min(1),
});

export const favoriteMediaSchema = z.object({
  itemId: mediaItemIdSchema,
  title: z.string().min(1),
  mediaType: z.enum(["Movie", "Series"]),
});

export type ReportProgressInput = z.infer<typeof reportProgressSchema>;
export type FavoriteMediaInput = z.infer<typeof favoriteMediaSchema>;
