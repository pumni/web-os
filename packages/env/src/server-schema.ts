import { clientEnvSchema } from "./client-schema";
import { z } from "zod";

export const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});
