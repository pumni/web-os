import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { headers } from 'next/headers';
import { serverEnv } from '@pumni/env/server';
import { processWebhookEvent } from '@/features/billing';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const secret = serverEnv.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error('POLAR_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret is missing' }, { status: 500 });
  }

  const rawBody = await req.text();
  const nextHeaders = await headers();
  const rawHeaders: Record<string, string> = {};
  nextHeaders.forEach((value, key) => {
    rawHeaders[key] = value;
  });

  const webhookId = rawHeaders['webhook-id'];
  if (!webhookId) {
    return NextResponse.json({ error: 'Missing webhook-id header' }, { status: 400 });
  }

  try {
    const event = validateEvent(rawBody, rawHeaders, secret);
    const result = await processWebhookEvent(webhookId, event);
    return NextResponse.json({ message: result.message }, { status: result.status });
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn('Polar webhook verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    console.error('Polar webhook handler failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
