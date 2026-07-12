import { clientEnvSchema } from './client-schema';
import { z } from 'zod';

export const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
  POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
  POLAR_SERVER: z.enum(['sandbox', 'production']).default('sandbox'),
  POLAR_PRODUCT_PRO_MONTHLY: z.string().min(1).optional(),
  POLAR_PRODUCT_PRO_YEARLY: z.string().min(1).optional(),
  POLAR_PRODUCT_MAX_MONTHLY: z.string().min(1).optional(),
  POLAR_PRODUCT_MAX_YEARLY: z.string().min(1).optional(),
});
