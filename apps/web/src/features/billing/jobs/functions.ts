import 'server-only';
import { inngest } from './client';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import { revalidateTag } from 'next/cache';
import { recordAuditEvent } from '@/shared/lib/audit';
import { captureServerEvent } from '@/shared/lib/analytics';
import { getPolarClient, tierForProductId } from '../polar';
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

export async function processPolarWebhookHandler({
  event,
  step,
  logger,
}: {
  event: { data: { webhookEventId: string; payload: PolarWebhookPayload } };
  step: { run: <T>(name: string, cb: () => Promise<T>) => Promise<T> };
  logger: {
    info: (msg: string) => void;
    error: (msg: string, err?: unknown) => void;
    warn: (msg: string) => void;
  };
}) {
  const { webhookEventId, payload } = event.data;
  const supabase = createSupabaseServiceRoleClient();

  // Deduplication check: short-circuit if already processed
  const alreadyProcessed = await step.run('check-processed', async () => {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('processed_at')
      .eq('provider', 'polar')
      .eq('provider_event_id', webhookEventId)
      .single();

    if (error) {
      logger.error('Failed to query webhook event status', error);
      throw error;
    }
    return !!data?.processed_at;
  });

  if (alreadyProcessed) {
    logger.info(`Webhook event ${webhookEventId} already processed.`);
    return { status: 200, message: 'Event already processed' };
  }

  let affectedUserId: string | null = null;
  let auditAction: string | null = null;
  let entityId: string | null = null;

  if (payload.type.startsWith('subscription.')) {
    const sub = payload.data;
    affectedUserId = sub.customer?.externalId || null;
    entityId = sub.id;

    if (!affectedUserId) {
      throw new Error(`Subscription event missing customer.externalId: ${sub.id}`);
    }

    if (
      payload.type === 'subscription.created' ||
      payload.type === 'subscription.active' ||
      payload.type === 'subscription.updated' ||
      payload.type === 'subscription.uncanceled' ||
      payload.type === 'subscription.past_due'
    ) {
      if (!sub.productId) {
        throw new Error(`Subscription event missing productId: ${sub.id}`);
      }

      const tier = tierForProductId(sub.productId);
      if (!tier) {
        const errorMsg = `Unknown Polar product ID: ${sub.productId} for subscription ${sub.id}`;
        logger.error(errorMsg);
        Sentry.captureMessage(errorMsg, 'error');

        await step.run('handle-unknown-product', async () => {
          const { error } = await supabase
            .from('webhook_events')
            .update({
              processed_at: new Date().toISOString(),
              error: errorMsg,
            })
            .eq('provider', 'polar')
            .eq('provider_event_id', webhookEventId);

          if (error) throw error;
        });

        return { status: 200, message: 'Subscription processed with unknown product ID' };
      }

      if (!sub.status) {
        throw new Error(`Subscription event missing status: ${sub.id}`);
      }

      await step.run('upsert-subscription', async () => {
        const { error } = await supabase.from('subscriptions').upsert(
          {
            user_id: affectedUserId!,
            provider: 'polar',
            provider_subscription_id: sub.id,
            tier,
            status: sub.status!,
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

        if (error) throw error;
      });

      if (payload.type === 'subscription.created' || payload.type === 'subscription.active') {
        await step.run('capture-upgraded', async () => {
          await captureServerEvent(affectedUserId!, 'upgraded', {
            subscriptionId: sub.id,
            tier,
          });
        });
      } else if (
        payload.type === 'subscription.updated' ||
        payload.type === 'subscription.uncanceled'
      ) {
        await step.run('capture-renewed', async () => {
          await captureServerEvent(affectedUserId!, 'subscription_renewed', {
            subscriptionId: sub.id,
            tier,
          });
        });
      }

      auditAction = `subscription.${payload.type.split('.')[1]}`;
    } else if (
      payload.type === 'subscription.canceled' ||
      payload.type === 'subscription.revoked'
    ) {
      if (!sub.status) {
        throw new Error(`Subscription event missing status: ${sub.id}`);
      }

      await step.run('cancel-subscription', async () => {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: sub.status!,
            current_period_end: sub.currentPeriodEnd
              ? new Date(sub.currentPeriodEnd).toISOString()
              : null,
            cancel_at_period_end: sub.cancelAtPeriodEnd || false,
            updated_at: new Date().toISOString(),
          })
          .eq('provider', 'polar')
          .eq('provider_subscription_id', sub.id);

        if (error) throw error;
      });

      await step.run('capture-canceled', async () => {
        await captureServerEvent(affectedUserId!, 'subscription_canceled', {
          subscriptionId: sub.id,
        });
      });

      auditAction = `subscription.${payload.type.split('.')[1]}`;
    }
  } else if (
    payload.type === 'customer.created' ||
    payload.type === 'customer.updated' ||
    payload.type === 'customer.state_changed'
  ) {
    const customer = payload.data;
    affectedUserId = customer.externalId || null;
    entityId = customer.id;

    if (affectedUserId) {
      await step.run('upsert-customer', async () => {
        const { error } = await supabase.from('billing_customers').upsert(
          {
            user_id: affectedUserId!,
            provider: 'polar',
            provider_customer_id: customer.id,
            email: customer.email || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          },
        );

        if (error) throw error;
      });

      auditAction = `customer.${payload.type.split('.')[1]}`;
    }
  } else if (payload.type === 'order.paid') {
    const order = payload.data;
    affectedUserId = order.customer?.externalId || null;
    entityId = order.id;
    auditAction = 'order.paid';

    if (affectedUserId) {
      await step.run('capture-checkout-completed', async () => {
        await captureServerEvent(affectedUserId!, 'checkout_completed', {
          orderId: order.id,
        });
      });
    }
  }

  if (affectedUserId) {
    await step.run('revalidate-cache', async () => {
      revalidateTag(`entitlements:${affectedUserId}`, 'max');
    });
  }

  if (auditAction) {
    await step.run('record-audit-event', async () => {
      await recordAuditEvent({
        actorId: null,
        action: auditAction!,
        entityType: auditAction!.split('.')[0] || '',
        entityId: entityId || undefined,
        metadata: { eventType: payload.type, webhookEventId },
      });
    });
  }

  await step.run('mark-processed', async () => {
    const { error } = await supabase
      .from('webhook_events')
      .update({
        processed_at: new Date().toISOString(),
      })
      .eq('provider', 'polar')
      .eq('provider_event_id', webhookEventId);

    if (error) throw error;
  });

  return { status: 200, message: 'Webhook processed successfully' };
}

interface PolarSubscription {
  id: string;
  productId: string;
  status: string;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean | null;
  metadata?: Record<string, unknown> | null;
  customer: {
    id: string;
    email: string | null;
    externalId: string | null;
  };
}

export async function nightlySubscriptionReconcileHandler({
  step,
  logger,
}: {
  step: { run: <T>(name: string, cb: () => Promise<T>) => Promise<T> };
  logger: {
    info: (msg: string) => void;
    error: (msg: string, err?: unknown) => void;
    warn: (msg: string) => void;
  };
}) {
  // 1. Fetch all subscriptions from Polar
  const polarSubs = await step.run('fetch-polar-subs', async () => {
    const polar = getPolarClient();
    let subs: PolarSubscription[] = [];

    const pageIterator = await polar.subscriptions.list({ limit: 100 });
    for await (const page of pageIterator) {
      const items = page.result.items as unknown as PolarSubscription[];
      subs = [...subs, ...items];
    }

    return subs;
  });

  const supabase = createSupabaseServiceRoleClient();

  // 2. Fetch local subscriptions
  const dbSubs = await step.run('fetch-db-subs', async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        'id, user_id, provider, provider_subscription_id, tier, status, current_period_end, cancel_at_period_end, metadata, updated_at',
      )
      .eq('provider', 'polar');

    if (error) throw error;
    return data || [];
  });

  const dbSubsMap = new Map(dbSubs.map((sub) => [sub.provider_subscription_id, sub]));

  // 3. Compare and Reconcile
  for (const polarSub of polarSubs) {
    const tier = tierForProductId(polarSub.productId);
    const userId = polarSub.customer.externalId;

    if (!tier) {
      const errorMsg = `Unknown Polar product ID: ${polarSub.productId} for subscription ${polarSub.id}`;
      logger.error(errorMsg);
      Sentry.captureMessage(errorMsg, 'error');
      continue;
    }

    if (!userId) {
      logger.warn(`Subscription ${polarSub.id} has no externalId mapping. Skipping.`);
      continue;
    }

    const existingDbSub = dbSubsMap.get(polarSub.id);

    if (!existingDbSub) {
      // Missing subscription in DB -> Insert it
      await step.run(`reconcile-create-${polarSub.id}`, async () => {
        const { error } = await supabase.from('subscriptions').insert({
          user_id: userId,
          provider: 'polar',
          provider_subscription_id: polarSub.id,
          tier,
          status: polarSub.status,
          current_period_end: polarSub.currentPeriodEnd
            ? new Date(polarSub.currentPeriodEnd).toISOString()
            : null,
          cancel_at_period_end: polarSub.cancelAtPeriodEnd || false,
          metadata: (polarSub.metadata as unknown as Json) || {},
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        revalidateTag(`entitlements:${userId}`, 'max');

        await recordAuditEvent({
          actorId: null,
          action: 'subscription.reconciled_created',
          entityType: 'subscription',
          entityId: polarSub.id,
          metadata: { source: 'reconciliation', status: polarSub.status },
        });
      });
    } else {
      // Exists in DB -> check for drift
      const currentPeriodEndStr = polarSub.currentPeriodEnd
        ? new Date(polarSub.currentPeriodEnd).toISOString()
        : null;
      const dbPeriodEndStr = existingDbSub.current_period_end
        ? new Date(existingDbSub.current_period_end).toISOString()
        : null;

      const hasDrift =
        existingDbSub.status !== polarSub.status ||
        existingDbSub.tier !== tier ||
        existingDbSub.cancel_at_period_end !== polarSub.cancelAtPeriodEnd ||
        dbPeriodEndStr !== currentPeriodEndStr;

      if (hasDrift) {
        await step.run(`reconcile-update-${polarSub.id}`, async () => {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: polarSub.status,
              tier,
              cancel_at_period_end: polarSub.cancelAtPeriodEnd || false,
              current_period_end: currentPeriodEndStr,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingDbSub.id);

          if (error) throw error;

          revalidateTag(`entitlements:${userId}`, 'max');

          await recordAuditEvent({
            actorId: null,
            action: 'subscription.reconciled_updated',
            entityType: 'subscription',
            entityId: polarSub.id,
            metadata: {
              source: 'reconciliation',
              oldStatus: existingDbSub.status,
              newStatus: polarSub.status,
              oldTier: existingDbSub.tier,
              newTier: tier,
            },
          });
        });
      }
    }
  }

  return { status: 200, message: 'Reconciliation complete' };
}

export async function cleanupStaleRoomsHandler({
  step,
  logger,
}: {
  step: { run: <T>(name: string, cb: () => Promise<T>) => Promise<T> };
  logger: {
    info: (msg: string) => void;
    error: (msg: string, err?: unknown) => void;
    warn: (msg: string) => void;
  };
}) {
  const supabase = createSupabaseServiceRoleClient();
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const roomsToDelete = await step.run('identify-stale-rooms', async () => {
    // Find watch rooms where last_active_at < 24h ago
    const { data: staleRooms, error: selectError } = await supabase
      .from('watch_rooms')
      .select('id')
      .lt('last_active_at', threshold);

    if (selectError) {
      logger.error('Failed to query stale rooms', selectError);
      throw selectError;
    }

    if (!staleRooms || staleRooms.length === 0) return [];

    const staleRoomIds = staleRooms.map((r) => r.id);

    // Filter out rooms that currently have active members
    const { data: members, error: membersError } = await supabase
      .from('room_members')
      .select('room_id')
      .in('room_id', staleRoomIds);

    if (membersError) {
      logger.error('Failed to query room members for stale check', membersError);
      throw membersError;
    }

    const activeRoomIds = new Set(members?.map((m) => m.room_id) || []);
    const toDelete = staleRoomIds.filter((id) => !activeRoomIds.has(id));

    return toDelete;
  });

  if (roomsToDelete.length > 0) {
    await step.run('delete-rooms', async () => {
      const { error } = await supabase.from('watch_rooms').delete().in('id', roomsToDelete);

      if (error) {
        logger.error('Failed to delete stale rooms', error);
        throw error;
      }
    });
    logger.info(`Deleted ${roomsToDelete.length} stale rooms.`);
  } else {
    logger.info('No stale rooms to delete.');
  }

  return { deletedCount: roomsToDelete.length };
}

export const processPolarWebhook = inngest.createFunction(
  { id: 'process-polar-webhook', retries: 3, triggers: [{ event: 'polar/webhook.received' }] },
  processPolarWebhookHandler,
);

export const nightlySubscriptionReconcile = inngest.createFunction(
  { id: 'nightly-subscription-reconcile', retries: 2, triggers: [{ cron: '0 2 * * *' }] },
  nightlySubscriptionReconcileHandler,
);

export const cleanupStaleRooms = inngest.createFunction(
  { id: 'cleanup-stale-rooms', retries: 1, triggers: [{ cron: '0 3 * * *' }] },
  cleanupStaleRoomsHandler,
);
