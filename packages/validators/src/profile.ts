import { z } from "zod";

export const profileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/)
    .nullable(),
  fullName: z.string().max(80).nullable(),
  avatarUrl: z.string().url().nullable().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
