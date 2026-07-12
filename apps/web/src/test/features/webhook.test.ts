import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/webhooks/polar/route';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { serverEnv } from '@pumni/env/server';
import { processWebhookEvent, inngest } from '@/features/billing';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import { headers } from 'next/headers';

vi.mock('@polar-sh/sdk/webhooks', () => ({
  validateEvent: vi.fn(),
  WebhookVerificationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'WebhookVerificationError';
    }
  },
}));

vi.mock('@pumni/env/server', () => ({
  serverEnv: {
    POLAR_WEBHOOK_SECRET: 'test_secret',
    INNGEST_SIGNING_KEY: undefined,
  },
}));

vi.mock('@/features/billing', () => ({
  processWebhookEvent: vi.fn(),
  tierForProductId: vi.fn(),
  inngest: {
    send: vi.fn(),
  },
}));

vi.mock('@pumni/supabase/service-role', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('Polar Webhook Route', () => {
  let mockSupabase: unknown;
  let mockSingleResult: { data: { processed_at: string | null } | null; error: { code: string } | null };
  let mockInsertResult: { error: { code: string } | null };

  beforeEach(() => {
    vi.resetAllMocks();
    serverEnv.POLAR_WEBHOOK_SECRET = 'test_secret';
    serverEnv.INNGEST_SIGNING_KEY = undefined;

    mockSingleResult = { data: null, error: null };
    mockInsertResult = { error: null };

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(mockSingleResult)),
      insert: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(chain),
    };

    vi.mocked(createSupabaseServiceRoleClient).mockReturnValue(mockSupabase as ReturnType<typeof createSupabaseServiceRoleClient>);
  });

  it('returns 500 if POLAR_WEBHOOK_SECRET is missing', async () => {
    serverEnv.POLAR_WEBHOOK_SECRET = undefined as unknown as string;
    const req = new Request('http://localhost', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('Webhook secret is missing');
  });

  it('returns 400 if webhook-id header is missing', async () => {
    const mockHeaders = new Headers();
    vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

    const req = new Request('http://localhost', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('Missing webhook-id header');
  });

  it('returns 401 if signature verification fails', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('webhook-id', 'evt_123');
    vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

    vi.mocked(validateEvent).mockImplementation(() => {
      throw new WebhookVerificationError('Invalid signature');
    });

    const req = new Request('http://localhost', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('Invalid signature');
  });

  describe('without Inngest (synchronous fallback)', () => {
    it('calls processWebhookEvent and returns its status/message on success', async () => {
      const mockHeaders = new Headers();
      mockHeaders.set('webhook-id', 'evt_123');
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

      const mockEvent = { type: 'subscription.created', timestamp: new Date(), data: { id: 'sub_123' } };
      vi.mocked(validateEvent).mockReturnValue(mockEvent as unknown as ReturnType<typeof validateEvent>);
      vi.mocked(processWebhookEvent).mockResolvedValue({ status: 200, message: 'Processed successfully' });

      const req = new Request('http://localhost', { method: 'POST', body: '{"hello":"world"}' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json() as { message: string };
      expect(json.message).toBe('Processed successfully');
      expect(processWebhookEvent).toHaveBeenCalledWith('evt_123', mockEvent);
    });
  });

  describe('with Inngest configured', () => {
    beforeEach(() => {
      serverEnv.INNGEST_SIGNING_KEY = 'test_inngest_key';
    });

    it('returns 200 and skips if event is already processed in DB', async () => {
      mockSingleResult = { data: { processed_at: '2026-07-12T00:00:00Z' }, error: null };

      const mockHeaders = new Headers();
      mockHeaders.set('webhook-id', 'evt_123');
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

      const mockEvent = { type: 'subscription.created', data: { id: 'sub_123' } };
      vi.mocked(validateEvent).mockReturnValue(mockEvent as unknown as ReturnType<typeof validateEvent>);

      const req = new Request('http://localhost', { method: 'POST', body: '{}' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json() as { message: string };
      expect(json.message).toBe('Event already processed');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('inserts event and enqueues to Inngest if not already processed', async () => {
      mockSingleResult = { data: null, error: null };
      mockInsertResult = { error: null };

      const mockHeaders = new Headers();
      mockHeaders.set('webhook-id', 'evt_123');
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

      const mockEvent = { type: 'subscription.created', data: { id: 'sub_123' } };
      vi.mocked(validateEvent).mockReturnValue(mockEvent as unknown as ReturnType<typeof validateEvent>);

      const req = new Request('http://localhost', { method: 'POST', body: '{}' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json() as { message: string };
      expect(json.message).toBe('Event enqueued to Inngest');

      expect(inngest.send).toHaveBeenCalledWith({
        name: 'polar/webhook.received',
        data: {
          webhookEventId: 'evt_123',
          payload: mockEvent,
        },
      });
    });
  });
});
