import { z } from 'zod';

export const checkoutSchema = z.object({
  tier: z.enum(['pro', 'max']),
  interval: z.enum(['monthly', 'yearly']),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
