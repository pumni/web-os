import { describe, it, expect } from 'vitest';
import {
  createTestId,
  renderRSC,
  MockClock,
  createMockUser,
  createMockSession,
} from '@pumni/test-utils';
import { WorkflowExecutor, type WorkflowDefinition } from '@pumni/workflows';

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

describe('Workflows Package (@pumni/workflows)', () => {
  it('should execute a simple workflow with runs and sleep steps', async () => {
    const executor = new WorkflowExecutor();

    const mockWorkflow: WorkflowDefinition<{ text: string }, string> = async (context, input) => {
      const step1 = await context.run('step-1', () => `${input.text}-step1`);
      // Simulate sleep (very short so test is fast)
      await context.sleep('sleep-step', 0.01);
      const step2 = await context.run('step-2', () => `${step1}-step2`);
      return step2;
    };

    const runId = await executor.start('test-flow', mockWorkflow, { text: 'start' });
    expect(runId).toContain('wf_');

    // Wait for the async execution to finish
    await new Promise((resolve) => setTimeout(resolve, 50));

    const status = executor.getStatus(runId);
    expect(status).toBeDefined();
    expect(status?.status).toBe('COMPLETED');
    expect(status?.output).toBe('start-step1-step2');
    expect(status?.history.length).toBe(3);
    expect(status?.history[0]?.stepName).toBe('step-1');
    expect(status?.history[0]?.status).toBe('SUCCESS');
    expect(status?.history[1]?.stepName).toBe('sleep-step');
    expect(status?.history[1]?.status).toBe('SUCCESS');
  });
});
