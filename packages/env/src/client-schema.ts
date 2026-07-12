import { z } from 'zod';

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1).optional(),
});
