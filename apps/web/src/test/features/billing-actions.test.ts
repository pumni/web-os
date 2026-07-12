import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { createCheckoutSession, createPortalSession } from '../../features/billing/actions';
import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import { getPolarClient, productIdFor } from '../../features/billing/polar';
import * as Sentry from '@sentry/nextjs';
import { setLimiter } from '../../shared/lib/rate-limit';
import { headers } from 'next/headers';

vi.mock('@pumni/auth', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@pumni/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('../../features/billing/polar', () => ({
  getPolarClient: vi.fn(),
  productIdFor: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withServerActionInstrumentation: vi.fn().mockImplementation((name, options, callback) => callback()),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

vi.mock('server-only', () => ({}));

vi.mock('@pumni/env/server', () => ({
  serverEnv: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    POLAR_ACCESS_TOKEN: 'test-polar-token',
    POLAR_SERVER: 'sandbox',
  },
}));

describe('Billing Actions', () => {
  let mockSupabase: unknown;
  let mockSelectSingle: Mock;
  let mockPolar: {
    checkouts: { create: Mock };
    customerSessions: { create: Mock };
  };

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(headers).mockResolvedValue({
      get: vi.fn().mockReturnValue('127.0.0.1'),
    } as unknown as Awaited<ReturnType<typeof headers>>);

    vi.mocked(Sentry.withServerActionInstrumentation).mockImplementation((name, options, callback) => callback());

    mockSelectSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSelectSingle,
      maybeSingle: mockSelectSingle,
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(chain),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);

    mockPolar = {
      checkouts: {
        create: vi.fn(),
      },
      customerSessions: {
        create: vi.fn(),
      },
    };
    vi.mocked(getPolarClient).mockReturnValue(mockPolar as unknown as ReturnType<typeof getPolarClient>);
  });

  afterEach(() => {
    setLimiter(null);
  });

  describe('createCheckoutSession', () => {
    it('creates a checkout session and returns the url', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);
      vi.mocked(productIdFor).mockReturnValue('prod_123');

      mockSelectSingle.mockResolvedValue({ data: { provider_customer_id: 'cust_abc' }, error: null });
      mockPolar.checkouts.create.mockResolvedValue({ url: 'https://checkout.polar.sh/123' });

      const result = await createCheckoutSession({ tier: 'pro', interval: 'monthly' });
      expect(result).toEqual({
        ok: true,
        data: { url: 'https://checkout.polar.sh/123' },
      });

      expect(mockPolar.checkouts.create).toHaveBeenCalledWith({
        products: ['prod_123'],
        externalCustomerId: 'user-123',
        customerId: 'cust_abc',
        successUrl: expect.stringContaining('/settings/account?checkout=success'),
        metadata: { userId: 'user-123' },
        customerEmail: 'user@example.com',
        customerIpAddress: '127.0.0.1',
      });
    });

    it('returns public failure on polar exception', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);
      mockPolar.checkouts.create.mockRejectedValue(new Error('Polar API Error'));

      const result = await createCheckoutSession({ tier: 'pro', interval: 'monthly' });
      expect(result.ok).toBe(false);
      expect((result as { ok: false; message: string }).message).toBe('Không thể khởi tạo phiên thanh toán. Vui lòng thử lại sau.');
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('returns validation failure on invalid input', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

      // Pass an invalid tier
      const result = await createCheckoutSession({ tier: 'invalid' as 'pro', interval: 'monthly' });
      expect(result.ok).toBe(false);
      expect((result as { ok: false; message: string }).message).toBe('Dữ liệu thanh toán không hợp lệ.');
    });

    it('returns failure if rate limited', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

      setLimiter({
        limit: async () => ({ success: false, reset: Date.now() + 60000 }),
      });

      const result = await createCheckoutSession({ tier: 'pro', interval: 'monthly' });
      expect(result).toEqual({
        ok: false,
        message: 'Vượt quá giới hạn thao tác, vui lòng thử lại sau.',
      });
    });

    it('returns public failure if requireUser rejects (unauthenticated)', async () => {
      vi.mocked(requireUser).mockRejectedValue(new Error('Unauthenticated'));

      const result = await createCheckoutSession({ tier: 'pro', interval: 'monthly' });
      expect(result.ok).toBe(false);
      expect((result as { ok: false; message: string }).message).toBe('Không thể khởi tạo phiên thanh toán. Vui lòng thử lại sau.');
    });
  });

  describe('createPortalSession', () => {
    it('returns failure if customer profile does not exist', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);
      mockSelectSingle.mockResolvedValue({ data: null, error: new Error('Not found') });

      const result = await createPortalSession();
      expect(result.ok).toBe(false);
      expect((result as { ok: false; message: string }).message).toBe('Bạn chưa có thông tin đăng ký thanh toán. Vui lòng đăng ký gói dịch vụ trước.');
      expect(Sentry.captureMessage).toHaveBeenCalledWith('No billing customer found for user user-123', 'warning');
    });

    it('creates customer portal session and returns url when customer exists', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);
      mockSelectSingle.mockResolvedValue({ data: { provider_customer_id: 'cust_abc' }, error: null });
      mockPolar.customerSessions.create.mockResolvedValue({ customerPortalUrl: 'https://portal.polar.sh/cust_abc' });

      const result = await createPortalSession();
      expect(result).toEqual({
        ok: true,
        data: { url: 'https://portal.polar.sh/cust_abc' },
      });
      expect(mockPolar.customerSessions.create).toHaveBeenCalledWith({
        customerId: 'cust_abc',
      });
    });

    it('returns failure if rate limited', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(requireUser).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof requireUser>>);

      setLimiter({
        limit: async () => ({ success: false, reset: Date.now() + 60000 }),
      });

      const result = await createPortalSession();
      expect(result).toEqual({
        ok: false,
        message: 'Vượt quá giới hạn thao tác, vui lòng thử lại sau.',
      });
    });
  });
});
