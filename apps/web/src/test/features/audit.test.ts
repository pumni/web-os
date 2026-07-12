import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordAuditEvent } from '../../shared/lib/audit';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import * as Sentry from '@sentry/nextjs';

vi.mock('server-only', () => ({}));

vi.mock('@pumni/supabase/service-role', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('Audit helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recordAuditEvent inserts the event details via service role client', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };
    vi.mocked(createSupabaseServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createSupabaseServiceRoleClient>);

    const event = {
      actorId: 'user-123',
      action: 'profile.updated',
      entityType: 'profile',
      entityId: 'user-123',
      metadata: { key: 'value' },
    };

    await recordAuditEvent(event);

    expect(mockSupabase.from).toHaveBeenCalledWith('audit_events');
    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: 'user-123',
      action: 'profile.updated',
      entity_type: 'profile',
      entity_id: 'user-123',
      metadata: { key: 'value' },
    });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('recordAuditEvent swallows insert failures and captures them in Sentry', async () => {
    const mockError = new Error('Database insert failed');
    const mockInsert = vi.fn().mockResolvedValue({ error: mockError });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };
    vi.mocked(createSupabaseServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createSupabaseServiceRoleClient>);

    const event = {
      actorId: null,
      action: 'system.event',
      entityType: 'system',
    };

    // Should not throw
    await expect(recordAuditEvent(event)).resolves.not.toThrow();

    expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
  });
});
