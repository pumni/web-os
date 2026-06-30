import { describe, it, expect } from 'vitest';
import {
  createTestId,
  renderRSC,
  MockClock,
  createMockUser,
  createMockSession,
} from '@pumni/test-utils';

describe('Test Utilities (@pumni/test-utils)', () => {
  it('should generate a unique test id with prefix', () => {
    const id = createTestId('test-prefix');
    expect(id).toContain('test-prefix_');
  });

  it('should render a mock React Server Component (RSC)', async () => {
    async function MockServerComponent(props: { name: string }) {
      return `Hello, ${props.name}!`;
    }
    const result = await renderRSC(MockServerComponent, { name: 'Pumni' });
    expect(result).toBe('Hello, Pumni!');
  });

  it('should control time deterministically via MockClock', () => {
    const clock = new MockClock(1000);
    expect(clock.now()).toBe(1000);

    clock.tick(500);
    expect(clock.now()).toBe(1500);
    expect(clock.toDate().getTime()).toBe(1500);
  });

  it('should throw an error when ticking backwards', () => {
    const clock = new MockClock(1000);
    expect(() => clock.tick(-10)).toThrow('Cannot move time backwards');
  });

  it('should create mock users and sessions', () => {
    const user = createMockUser({ email: 'test@pumni.io' });
    expect(user.email).toBe('test@pumni.io');
    expect(user.id).toContain('user_');

    const session = createMockSession({ id: 'custom-id' });
    expect(session.user.id).toBe('custom-id');
    expect(session.access_token).toBe('mock-access-token');
  });
});
