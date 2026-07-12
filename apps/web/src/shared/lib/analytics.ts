import 'server-only';
import { PostHog } from 'posthog-node';
import { serverEnv } from '@pumni/env/server';

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const token = serverEnv.NEXT_PUBLIC_POSTHOG_TOKEN;
  if (!token) return;

  const client = new PostHog(token, {
    host: serverEnv.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({
      distinctId,
      event,
      properties,
    });
    await client.shutdown();
  } catch (err) {
    console.error('Failed to capture PostHog server event:', err);
  }
}
