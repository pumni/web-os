import { serve } from 'inngest/next';
import { inngest, processPolarWebhook, nightlySubscriptionReconcile, cleanupStaleRooms } from '@/features/billing';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processPolarWebhook, nightlySubscriptionReconcile, cleanupStaleRooms],
});
