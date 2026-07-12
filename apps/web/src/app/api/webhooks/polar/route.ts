import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { headers } from 'next/headers';
import { serverEnv } from '@pumni/env/server';
import { processWebhookEvent, inngest } from '@/features/billing';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import type { Json } from '@pumni/supabase';
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

    if (serverEnv.INNGEST_SIGNING_KEY) {
      const supabase = createSupabaseServiceRoleClient();
      
      // 1. Idempotency Check & Insert
      const { data: existingEvent } = await supabase
        .from('webhook_events')
        .select('id, processed_at')
        .eq('provider', 'polar')
        .eq('provider_event_id', webhookId)
        .single();

      if (existingEvent) {
        if (existingEvent.processed_at) {
          return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
        }
      } else {
        const { error: insertError } = await supabase
          .from('webhook_events')
          .insert({
            provider: 'polar',
            provider_event_id: webhookId,
            event_type: event.type,
            payload: event as unknown as Json,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
          }
          console.error('Failed to insert webhook event:', insertError);
          return NextResponse.json({ error: 'Failed to record webhook event' }, { status: 500 });
        }
      }

      // 2. Enqueue event to Inngest
      await inngest.send({
        name: 'polar/webhook.received',
        data: {
          webhookEventId: webhookId,
          payload: event,
        },
      });

      return NextResponse.json({ message: 'Event enqueued to Inngest' }, { status: 200 });
    } else {
      // Fallback path: process synchronously
      const result = await processWebhookEvent(webhookId, event);
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn('Polar webhook verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    console.error('Polar webhook handler failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
