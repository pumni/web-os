/**
 * Framework-agnostic test utilities shared across the monorepo.
 *
 * Pure helpers (fixtures, id factories, builders) live here so unit and e2e
 * suites can reuse them. Add runner-specific helpers (Vitest, Playwright) in
 * dedicated entry points to avoid pulling those deps into every consumer.
 */

/** Generate a stable-ish unique id for use in test fixtures. */
export function createTestId(prefix = 'test'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Resolve a React Server Component (async function) with props for unit testing. */
export async function renderRSC<T extends (...args: any[]) => Promise<any>>(
  Component: T,
  props: Parameters<T>[0]
): Promise<Awaited<ReturnType<T>>> {
  return await Component(props);
}

/** A deterministic mock clock to control time in tests. */
export class MockClock {
  private currentTimeMs: number;

  constructor(initialTimeMs = 1700000000000) {
    this.currentTimeMs = initialTimeMs;
  }

  /** Get the current mock time in milliseconds. */
  now(): number {
    return this.currentTimeMs;
  }

  /** Advance the mock time by a given duration in milliseconds. */
  tick(ms: number): void {
    if (ms < 0) {
      throw new Error('Cannot move time backwards');
    }
    this.currentTimeMs += ms;
  }

  /** Get a standard JS Date object at the current mock time. */
  toDate(): Date {
    return new Date(this.currentTimeMs);
  }
}

export interface MockUserOptions {
  id?: string;
  email?: string;
  user_metadata?: Record<string, any>;
  role?: string;
}

/** Generate a mock Supabase User object. */
export function createMockUser(options: MockUserOptions = {}) {
  const id = options.id ?? createTestId('user');
  return {
    id,
    email: options.email ?? `${id}@example.com`,
    role: options.role ?? 'authenticated',
    user_metadata: options.user_metadata ?? {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };
}

/** Generate a mock session containing a user. */
export function createMockSession(userOptions: MockUserOptions = {}) {
  const user = createMockUser(userOptions);
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token',
    user,
  };
}
