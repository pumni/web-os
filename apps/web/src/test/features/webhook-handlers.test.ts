import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { processWebhookEvent } from '../../features/billing/webhook-handlers';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import { revalidateTag } from 'next/cache';
import { recordAuditEvent } from '@/shared/lib/audit';
import { tierForProductId } from '../../features/billing/polar';

vi.mock('@pumni/supabase/service-role', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/audit', () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock('../../features/billing/polar', () => ({
  tierForProductId: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('processWebhookEvent', () => {
  let mockSupabase: unknown;
  let mockInsert: Mock;
  let mockUpsert: Mock;
  let mockUpdate: Mock;
  let mockSelectSingle: Mock;

  beforeEach(() => {
    vi.resetAllMocks();

    mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockUpdate = vi.fn().mockReturnThis();
    mockSelectSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSelectSingle,
      insert: mockInsert,
      upsert: mockUpsert,
      update: mockUpdate,
      then: vi.fn().mockImplementation((onfulfilled) => {
        // Resolve to the value of mockUpdate or general success
        return Promise.resolve({ error: null }).then(onfulfilled);
      }),
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(chain),
    };

    vi.mocked(createSupabaseServiceRoleClient).mockReturnValue(mockSupabase as ReturnType<typeof createSupabaseServiceRoleClient>);
  });

  it('handles duplicate event insertion gracefully by returning 200', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const result = await processWebhookEvent('evt_123', { type: 'subscription.created' });
    expect(result.status).toBe(200);
    expect(result.message).toBe('Event already processed');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('skips processing if event is already marked as processed', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'some-uuid', processed_at: '2026-07-12T00:00:00Z' },
      error: null,
    });

    const result = await processWebhookEvent('evt_123', { type: 'subscription.created' });
    expect(result.status).toBe(200);
    expect(result.message).toBe('Event already processed');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('processes subscription.created: upserts subscription, invalidates cache tag and logs audit event', async () => {
    vi.mocked(tierForProductId).mockReturnValue('pro');

    const event = {
      type: 'subscription.created',
      data: {
        id: 'sub_123',
        productId: 'prod_pro_monthly',
        status: 'active',
        currentPeriodEnd: '2026-08-12T00:00:00.000Z',
        cancelAtPeriodEnd: false,
        metadata: { source: 'test' },
        customer: {
          externalId: 'user_123',
        },
      },
    };

    const result = await processWebhookEvent('evt_123', event);
    expect(result.status).toBe(200);
    expect(result.message).toBe('Webhook processed successfully');

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user_123',
        provider: 'polar',
        provider_subscription_id: 'sub_123',
        tier: 'pro',
        status: 'active',
        cancel_at_period_end: false,
      }),
      { onConflict: 'provider,provider_subscription_id' }
    );

    expect(revalidateTag).toHaveBeenCalledWith('entitlements:user_123', 'max');
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'subscription.created',
        entityType: 'subscription',
        entityId: 'sub_123',
      })
    );
  });

  it('returns 200 with error stored if product ID has unknown tier', async () => {
    vi.mocked(tierForProductId).mockReturnValue(null);

    const event = {
      type: 'subscription.created',
      data: {
        id: 'sub_123',
        productId: 'unknown_prod',
        customer: {
          externalId: 'user_123',
        },
      },
    };

    const result = await processWebhookEvent('evt_123', event);
    expect(result.status).toBe(200);
    expect(result.message).toBe('Subscription processed with unknown product ID');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unknown Polar product ID: unknown_prod for subscription sub_123',
      })
    );
  });

  it('returns 500 and updates webhook_event error if handler dependency fails', async () => {
    vi.mocked(tierForProductId).mockReturnValue('pro');
    mockUpsert.mockResolvedValue({ error: { code: 'some_db_err', message: 'DB connection error' } });

    const event = {
      type: 'subscription.created',
      data: {
        id: 'sub_123',
        productId: 'prod_pro_monthly',
        status: 'active',
        customer: {
          externalId: 'user_123',
        },
      },
    };

    const result = await processWebhookEvent('evt_123', event);
    expect(result.status).toBe(500);
    expect(result.message).toContain('DB connection error');

    // Should update the webhook event with the error message
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('DB connection error'),
      })
    );
  });
});
