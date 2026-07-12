import { clientEnvSchema } from './client-schema';
import { z } from 'zod';

type ClientEnv = z.infer<typeof clientEnvSchema>;

let parsedEnv: ClientEnv | null = null;

export const clientEnv = new Proxy({} as ClientEnv, {
  get(target, prop) {
    if (!parsedEnv) {
      parsedEnv = clientEnvSchema.parse({
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      });
    }
    return Reflect.get(parsedEnv, prop);
  },
});

