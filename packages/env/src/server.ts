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
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
        INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
        INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
        NEXT_PUBLIC_POSTHOG_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_TOKEN,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      });
    }
    return Reflect.get(parsedEnv, prop);
  },
});

