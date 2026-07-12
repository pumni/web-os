import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/webhooks/polar/route';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { serverEnv } from '@pumni/env/server';
import { processWebhookEvent } from '@/features/billing';
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
  },
}));

vi.mock('@/features/billing', () => ({
  processWebhookEvent: vi.fn(),
  tierForProductId: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('server-only', () => ({}));

describe('Polar Webhook Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    serverEnv.POLAR_WEBHOOK_SECRET = 'test_secret';
  });

  it('returns 500 if POLAR_WEBHOOK_SECRET is missing', async () => {
    serverEnv.POLAR_WEBHOOK_SECRET = undefined as unknown as string;
    const req = new Request('http://localhost', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Webhook secret is missing');
  });

  it('returns 400 if webhook-id header is missing', async () => {
    const mockHeaders = new Headers();
    vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

    const req = new Request('http://localhost', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
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
    const json = await res.json();
    expect(json.error).toBe('Invalid signature');
  });

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
    const json = await res.json();
    expect(json.message).toBe('Processed successfully');
    expect(processWebhookEvent).toHaveBeenCalledWith('evt_123', mockEvent);
  });
});
