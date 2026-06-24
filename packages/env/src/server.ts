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
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    }
    return Reflect.get(parsedEnv, prop);
  },
});

