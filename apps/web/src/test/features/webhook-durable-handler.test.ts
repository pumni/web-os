import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPolarWebhookHandler } from '../../features/billing/jobs/functions';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import { recordAuditEvent } from '../../shared/lib/audit';
import { captureServerEvent } from '../../shared/lib/analytics';
import { revalidateTag } from 'next/cache';
import { tierForProductId } from '../../features/billing/polar';

vi.mock('@pumni/supabase/service-role', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock('../../shared/lib/audit', () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock('../../shared/lib/analytics', () => ({
  captureServerEvent: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('../../features/billing/polar', () => ({
  getPolarClient: vi.fn(),
  tierForProductId: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('Durable Webhook Handler (processPolarWebhookHandler)', () => {
  let mockSupabase: {
    from: import('vitest').Mock;
  };
  let mockSelect: import('vitest').Mock;
  let mockUpsert: import('vitest').Mock;
  let mockUpdate: import('vitest').Mock;
  let mockInsert: import('vitest').Mock;
  let mockStep: {
    run: import('vitest').Mock;
  };
  let mockLogger: {
    info: import('vitest').Mock;
    warn: import('vitest').Mock;
    error: import('vitest').Mock;
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockSelect = vi.fn();
    mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockUpdate = vi.fn().mockReturnThis();
    mockInsert = vi.fn().mockResolvedValue({ error: null });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSelect,
      upsert: mockUpsert,
      update: mockUpdate,
      insert: mockInsert,
      then: vi.fn().mockImplementation((onfulfilled) => {
        return Promise.resolve({ error: null }).then(onfulfilled);
      }),
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(chain),
    };

    vi.mocked(createSupabaseServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createSupabaseServiceRoleClient>);

    mockStep = {
      run: vi.fn().mockImplementation((name, cb) => cb()),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    vi.mocked(tierForProductId).mockImplementation((prodId) => {
      if (prodId === 'prod_pro') return 'pro';
      return null;
    });
  });

  it('skips processing if the event was already processed', async () => {
    mockSelect.mockResolvedValue({
      data: { processed_at: '2026-07-12T00:00:00Z' },
      error: null,
    });

    const event = {
      data: {
        webhookEventId: 'evt_123',
        payload: {
          type: 'subscription.created',
          data: { id: 'sub_123' },
        },
      },
    };

    const result = await processPolarWebhookHandler({
      event: event as unknown as Parameters<typeof processPolarWebhookHandler>[0]['event'],
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.status).toBe(200);
    expect(result.message).toBe('Event already processed');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('handles unknown product IDs by marking the event with an error', async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: null,
    });

    const event = {
      data: {
        webhookEventId: 'evt_123',
        payload: {
          type: 'subscription.created',
          data: {
            id: 'sub_123',
            productId: 'unknown_product_id',
            customer: { id: 'cust_abc', externalId: 'user_123' },
          },
        },
      },
    };

    const result = await processPolarWebhookHandler({
      event: event as unknown as Parameters<typeof processPolarWebhookHandler>[0]['event'],
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.status).toBe(200);
    expect(result.message).toBe('Subscription processed with unknown product ID');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unknown Polar product ID: unknown_product_id for subscription sub_123',
      })
    );
  });

  it('processes subscription created successfully and triggers analytics upgraded event', async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: null,
    });

    const event = {
      data: {
        webhookEventId: 'evt_123',
        payload: {
          type: 'subscription.created',
          data: {
            id: 'sub_123',
            productId: 'prod_pro',
            status: 'active',
            customer: { id: 'cust_abc', externalId: 'user_123' },
            currentPeriodEnd: '2026-08-12T00:00:00Z',
            cancelAtPeriodEnd: false,
            metadata: {},
          },
        },
      },
    };

    const result = await processPolarWebhookHandler({
      event: event as unknown as Parameters<typeof processPolarWebhookHandler>[0]['event'],
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user_123',
        provider_subscription_id: 'sub_123',
        tier: 'pro',
        status: 'active',
      }),
      { onConflict: 'provider,provider_subscription_id' }
    );
    expect(captureServerEvent).toHaveBeenCalledWith('user_123', 'upgraded', {
      subscriptionId: 'sub_123',
      tier: 'pro',
    });
    expect(revalidateTag).toHaveBeenCalledWith('entitlements:user_123', 'max');
    expect(recordAuditEvent).toHaveBeenCalled();
  });

  it('processes subscription canceled successfully and triggers analytics subscription_canceled event', async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: null,
    });

    const event = {
      data: {
        webhookEventId: 'evt_123',
        payload: {
          type: 'subscription.canceled',
          data: {
            id: 'sub_123',
            status: 'canceled',
            customer: { id: 'cust_abc', externalId: 'user_123' },
          },
        },
      },
    };

    const result = await processPolarWebhookHandler({
      event: event as unknown as Parameters<typeof processPolarWebhookHandler>[0]['event'],
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
      })
    );
    expect(captureServerEvent).toHaveBeenCalledWith('user_123', 'subscription_canceled', {
      subscriptionId: 'sub_123',
    });
  });

  it('processes order paid successfully and triggers analytics checkout_completed event', async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: null,
    });

    const event = {
      data: {
        webhookEventId: 'evt_123',
        payload: {
          type: 'order.paid',
          data: {
            id: 'ord_123',
            customer: { id: 'cust_abc', externalId: 'user_123' },
          },
        },
      },
    };

    const result = await processPolarWebhookHandler({
      event: event as unknown as Parameters<typeof processPolarWebhookHandler>[0]['event'],
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.status).toBe(200);
    expect(captureServerEvent).toHaveBeenCalledWith('user_123', 'checkout_completed', {
      orderId: 'ord_123',
    });
  });
});
