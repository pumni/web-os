import 'server-only';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import * as Sentry from '@sentry/nextjs';

import type { Json } from '@pumni/supabase';

export type AuditEvent = {
  actorId: string | null;          // null for system/webhook events
  action: string;                  // '<entity>.<verb>' e.g. 'subscription.activated'
  entityType: string;              // 'profile' | 'watch_room' | 'subscription' | ...
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Service-role insert. Fire-and-forget: never throws; failures go to Sentry.
 * Rationale: Audit rows must persist even when the acting context is a webhook
 * with no authenticated session or when user privileges would otherwise block the write.
 */
export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.from('audit_events').insert({
      actor_id: event.actorId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId || null,
      metadata: (event.metadata as unknown as Json) || {},
    });
    if (error) {
      console.error('Failed to record audit event:', error);
      Sentry.captureException(error);
    }
  } catch (error) {
    console.error('Failed to record audit event exception:', error);
    Sentry.captureException(error);
  }
}
