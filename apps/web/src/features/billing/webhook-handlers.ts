import 'server-only';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';

import { revalidateTag } from 'next/cache';
import { recordAuditEvent } from '@/shared/lib/audit';
import { captureServerEvent } from '@/shared/lib/analytics';
import { tierForProductId } from './polar';
import * as Sentry from '@sentry/nextjs';
import type { Json } from '@pumni/supabase';

interface PolarWebhookPayload {
  type: string;
  data: {
    id: string;
    customer?: {
      id: string;
      email?: string | null;
      externalId?: string | null;
    } | null;
    productId?: string;
    status?: string;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean | null;
    metadata?: Record<string, unknown> | null;
    email?: string | null;
    externalId?: string | null;
  };
}

export async function processWebhookEvent(
  webhookEventId: string,
  rawEvent: unknown,
): Promise<{ status: number; message: string }> {
  const event = rawEvent as PolarWebhookPayload;
  const supabase = createSupabaseServiceRoleClient();

  // 1. Idempotency Check & Insert
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, processed_at')
    .eq('provider', 'polar')
    .eq('provider_event_id', webhookEventId)
    .single();

  if (existingEvent) {
    if (existingEvent.processed_at) {
      return { status: 200, message: 'Event already processed' };
    }
  } else {
    const { error: insertError } = await supabase.from('webhook_events').insert({
      provider: 'polar',
      provider_event_id: webhookEventId,
      event_type: event.type,
      payload: event as unknown as Json,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return { status: 200, message: 'Event already processed' };
      }
      console.error('Failed to insert webhook event:', insertError);
      Sentry.captureException(insertError);
      return { status: 500, message: 'Failed to record webhook event' };
    }
  }

  try {
    let affectedUserId: string | null = null;
    let auditAction: string | null = null;
    let entityId: string | null = null;

    if (event.type.startsWith('subscription.')) {
      const sub = event.data;
      affectedUserId = sub.customer?.externalId || null;
      entityId = sub.id;

      if (!affectedUserId) {
        throw new Error(`Subscription event missing customer.externalId: ${sub.id}`);
      }

      if (
        event.type === 'subscription.created' ||
        event.type === 'subscription.active' ||
        event.type === 'subscription.updated' ||
        event.type === 'subscription.uncanceled' ||
        event.type === 'subscription.past_due'
      ) {
        if (!sub.productId) {
          throw new Error(`Subscription event missing productId: ${sub.id}`);
        }

        const tier = tierForProductId(sub.productId);
        if (!tier) {
          const errorMsg = `Unknown Polar product ID: ${sub.productId} for subscription ${sub.id}`;
          console.error(errorMsg);
          Sentry.captureMessage(errorMsg, 'error');

          await supabase
            .from('webhook_events')
            .update({
              processed_at: new Date().toISOString(),
              error: errorMsg,
            })
            .eq('provider', 'polar')
            .eq('provider_event_id', webhookEventId);

          return { status: 200, message: 'Subscription processed with unknown product ID' };
        }

        if (!sub.status) {
          throw new Error(`Subscription event missing status: ${sub.id}`);
        }

        const { error: subError } = await supabase.from('subscriptions').upsert(
          {
            user_id: affectedUserId,
            provider: 'polar',
            provider_subscription_id: sub.id,
            tier,
            status: sub.status,
            current_period_end: sub.currentPeriodEnd
              ? new Date(sub.currentPeriodEnd).toISOString()
              : null,
            cancel_at_period_end: sub.cancelAtPeriodEnd || false,
            metadata: (sub.metadata as unknown as Json) || {},
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'provider,provider_subscription_id',
          },
        );

        if (subError) {
          throw subError;
        }

        if (event.type === 'subscription.created' || event.type === 'subscription.active') {
          await captureServerEvent(affectedUserId, 'upgraded', {
            subscriptionId: sub.id,
            tier,
          });
        } else if (
          event.type === 'subscription.updated' ||
          event.type === 'subscription.uncanceled'
        ) {
          await captureServerEvent(affectedUserId, 'subscription_renewed', {
            subscriptionId: sub.id,
            tier,
          });
        }

        auditAction = `subscription.${event.type.split('.')[1]}`;
      } else if (event.type === 'subscription.canceled' || event.type === 'subscription.revoked') {
        if (!sub.status) {
          throw new Error(`Subscription event missing status: ${sub.id}`);
        }

        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            current_period_end: sub.currentPeriodEnd
              ? new Date(sub.currentPeriodEnd).toISOString()
              : null,
            cancel_at_period_end: sub.cancelAtPeriodEnd || false,
            updated_at: new Date().toISOString(),
          })
          .eq('provider', 'polar')
          .eq('provider_subscription_id', sub.id);

        if (subError) {
          throw subError;
        }

        await captureServerEvent(affectedUserId, 'subscription_canceled', {
          subscriptionId: sub.id,
        });

        auditAction = `subscription.${event.type.split('.')[1]}`;
      }
    } else if (
      event.type === 'customer.created' ||
      event.type === 'customer.updated' ||
      event.type === 'customer.state_changed'
    ) {
      const customer = event.data;
      affectedUserId = customer.externalId || null;
      entityId = customer.id;

      if (affectedUserId) {
        const { error: customerError } = await supabase.from('billing_customers').upsert(
          {
            user_id: affectedUserId,
            provider: 'polar',
            provider_customer_id: customer.id,
            email: customer.email || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          },
        );

        if (customerError) {
          throw customerError;
        }

        auditAction = `customer.${event.type.split('.')[1]}`;
      }
    } else if (event.type === 'order.paid') {
      const order = event.data;
      affectedUserId = order.customer?.externalId || null;
      entityId = order.id;
      auditAction = 'order.paid';

      if (affectedUserId) {
        await captureServerEvent(affectedUserId, 'checkout_completed', {
          orderId: order.id,
        });
      }
    }

    if (affectedUserId) {
      revalidateTag(`entitlements:${affectedUserId}`, 'max');
    }

    if (auditAction) {
      await recordAuditEvent({
        actorId: null,
        action: auditAction,
        entityType: auditAction.split('.')[0] || '',
        entityId: entityId || undefined,
        metadata: { eventType: event.type, webhookEventId },
      });
    }

    const { error: updateEventError } = await supabase
      .from('webhook_events')
      .update({
        processed_at: new Date().toISOString(),
      })
      .eq('provider', 'polar')
      .eq('provider_event_id', webhookEventId);

    if (updateEventError) {
      console.error('Failed to mark event as processed:', updateEventError);
      Sentry.captureException(updateEventError);
    }

    return { status: 200, message: 'Webhook processed successfully' };
  } catch (err) {
    const errMsg =
      err instanceof Error
        ? err.message
        : err && typeof err === 'object' && 'message' in err
          ? String((err as Record<string, unknown>).message)
          : String(err);
    console.error('Error processing webhook event:', err);
    Sentry.captureException(err);

    const { error: updateEventError } = await supabase
      .from('webhook_events')
      .update({
        error: errMsg,
      })
      .eq('provider', 'polar')
      .eq('provider_event_id', webhookEventId);

    if (updateEventError) {
      console.error('Failed to update event error:', updateEventError);
      Sentry.captureException(updateEventError);
    }

    return { status: 500, message: errMsg };
  }
}
