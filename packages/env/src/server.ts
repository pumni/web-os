import 'server-only';

import { serverEnvSchema } from './server-schema';
import { z } from 'zod';

type ServerEnv = z.infer<typeof serverEnvSchema>;

let parsedEnv: ServerEnv | null = null;

export const serverEnv = new Proxy({} as ServerEnv, {
  get(target, prop) {
    if (!parsedEnv) {
      parsedEnv = serverEnvSchema.parse({
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
        POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
        POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
        POLAR_SERVER: process.env.POLAR_SERVER,
        POLAR_PRODUCT_PRO_MONTHLY: process.env.POLAR_PRODUCT_PRO_MONTHLY,
        POLAR_PRODUCT_PRO_YEARLY: process.env.POLAR_PRODUCT_PRO_YEARLY,
        POLAR_PRODUCT_MAX_MONTHLY: process.env.POLAR_PRODUCT_MAX_MONTHLY,
        POLAR_PRODUCT_MAX_YEARLY: process.env.POLAR_PRODUCT_MAX_YEARLY,
      });
    }
    return Reflect.get(parsedEnv, prop);
  },
});

