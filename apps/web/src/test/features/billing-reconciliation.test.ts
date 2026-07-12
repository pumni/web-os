import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nightlySubscriptionReconcileHandler } from '../../features/billing/jobs/functions';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import { getPolarClient, tierForProductId } from '../../features/billing/polar';
import { recordAuditEvent } from '../../shared/lib/audit';
import { revalidateTag } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

vi.mock('@pumni/supabase/service-role', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock('../../features/billing/polar', () => ({
  getPolarClient: vi.fn(),
  tierForProductId: vi.fn(),
}));

vi.mock('../../shared/lib/audit', () => ({
  recordAuditEvent: vi.fn(),
}));

vi.mock('next/cache', () => ({
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('Nightly Subscription Reconciliation', () => {
  let mockSupabase: {
    from: import('vitest').Mock;
  };
  let mockInsert: import('vitest').Mock;
  let mockUpdate: import('vitest').Mock;
  let mockPolar: {
    subscriptions: {
      list: import('vitest').Mock;
    };
  };
  let mockLogger: {
    info: import('vitest').Mock;
    error: import('vitest').Mock;
    warn: import('vitest').Mock;
  };
  let mockStep: {
    run: import('vitest').Mock;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockUpdate = vi.fn().mockResolvedValue({ error: null });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: mockInsert,
      update: mockUpdate,
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(chain),
    };

    vi.mocked(createSupabaseServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createSupabaseServiceRoleClient>);

    mockPolar = {
      subscriptions: {
        list: vi.fn(),
      },
    };
    vi.mocked(getPolarClient).mockReturnValue(mockPolar as unknown as ReturnType<typeof getPolarClient>);

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    // step.run mock executes the callback synchronously
    mockStep = {
      run: vi.fn().mockImplementation((name, cb) => cb()),
    };

    vi.mocked(tierForProductId).mockImplementation((prodId) => {
      if (prodId === 'prod_pro') return 'pro';
      if (prodId === 'prod_max') return 'max';
      return null;
    });
  });

  it('inserts new subscriptions missing from the local database', async () => {
    const polarSub = {
      id: 'sub_123',
      productId: 'prod_pro',
      status: 'active',
      currentPeriodEnd: new Date('2026-08-12T00:00:00Z'),
      cancelAtPeriodEnd: false,
      metadata: {},
      customer: {
        id: 'cust_abc',
        externalId: 'user_123',
      },
    };

    mockPolar.subscriptions.list.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          result: {
            items: [polarSub],
            pagination: { maxPage: 1, totalCount: 1 },
          },
        };
      },
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }), // empty DB
          insert: mockInsert,
        };
      }
      return {};
    });

    const result = await nightlySubscriptionReconcileHandler({
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user_123',
        provider_subscription_id: 'sub_123',
        tier: 'pro',
        status: 'active',
      })
    );
    expect(revalidateTag).toHaveBeenCalledWith('entitlements:user_123', 'max');
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'subscription.reconciled_created',
        entityId: 'sub_123',
      })
    );
  });

  it('updates local subscriptions that have drifted from Polar', async () => {
    const polarSub = {
      id: 'sub_123',
      productId: 'prod_pro',
      status: 'canceled', // polar canceled
      currentPeriodEnd: new Date('2026-08-12T00:00:00Z'),
      cancelAtPeriodEnd: true,
      metadata: {},
      customer: {
        id: 'cust_abc',
        externalId: 'user_123',
      },
    };

    mockPolar.subscriptions.list.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          result: {
            items: [polarSub],
            pagination: { maxPage: 1, totalCount: 1 },
          },
        };
      },
    });

    const localDbSub = {
      id: 'db_row_789',
      user_id: 'user_123',
      provider_subscription_id: 'sub_123',
      tier: 'pro',
      status: 'active', // db is active (drift!)
      cancel_at_period_end: false,
      current_period_end: new Date('2026-08-12T00:00:00Z').toISOString(),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [localDbSub], error: null }),
          update: mockUpdate,
        };
      }
      return {};
    });

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await nightlySubscriptionReconcileHandler({
      step: mockStep,
      logger: mockLogger,
    });

    expect(result.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
        cancel_at_period_end: true,
      })
    );
    expect(revalidateTag).toHaveBeenCalledWith('entitlements:user_123', 'max');
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'subscription.reconciled_updated',
        entityId: 'sub_123',
      })
    );
  });

  it('captures an exception if product ID maps to an unknown tier', async () => {
    const polarSub = {
      id: 'sub_unknown',
      productId: 'prod_invalid_id',
      status: 'active',
      currentPeriodEnd: new Date('2026-08-12T00:00:00Z'),
      cancelAtPeriodEnd: false,
      metadata: {},
      customer: {
        id: 'cust_abc',
        externalId: 'user_123',
      },
    };

    mockPolar.subscriptions.list.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          result: {
            items: [polarSub],
            pagination: { maxPage: 1, totalCount: 1 },
          },
        };
      },
    });

    await nightlySubscriptionReconcileHandler({
      step: mockStep,
      logger: mockLogger,
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Unknown Polar product ID: prod_invalid_id for subscription sub_unknown',
      'error'
    );
  });
});
