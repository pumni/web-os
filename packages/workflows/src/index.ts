/**
 * @pumni/workflows - Durable Execution Layer for Pumni Web OS.
 * Provides APIs to model multi-step background jobs with deterministic execution.
 */

export interface WorkflowContext {
  run<T>(stepName: string, fn: () => Promise<T> | T): Promise<T>;
  sleep(stepName: string, seconds: number): Promise<void>;
}

export type WorkflowDefinition<TInput, TOutput> = (
  context: WorkflowContext,
  input: TInput
) => Promise<TOutput>;

export interface WorkflowInstance<TInput, TOutput> {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  input: TInput;
  output?: TOutput;
  error?: string;
  history: Array<{
    stepName: string;
    type: 'RUN' | 'SLEEP';
    status: 'START' | 'SUCCESS' | 'FAILED';
    result?: any;
    timestamp: number;
  }>;
}

/**
 * Standard implementation of a local/in-memory workflow engine.
 * Can be plugged into Vercel Workflows or custom database persistence models.
 */
export class WorkflowExecutor {
  private instances = new Map<string, WorkflowInstance<any, any>>();

  /** Register and initiate a workflow */
  async start<TInput, TOutput>(
    name: string,
    workflow: WorkflowDefinition<TInput, TOutput>,
    input: TInput
  ): Promise<string> {
    const id = `wf_${Math.random().toString(36).slice(2, 10)}`;
    const instance: WorkflowInstance<TInput, TOutput> = {
      id,
      name,
      status: 'PENDING',
      input,
      history: [],
    };
    this.instances.set(id, instance);

    // Run asynchronously to simulate background execution
    this.runInstance(id, workflow, input).catch((err) => {
      console.error(`Workflow ${name} (${id}) failed:`, err);
    });

    return id;
  }

  /** Retrieve the execution state of a workflow */
  getStatus(id: string): WorkflowInstance<any, any> | undefined {
    return this.instances.get(id);
  }

  private async runInstance<TInput, TOutput>(
    id: string,
    workflow: WorkflowDefinition<TInput, TOutput>,
    input: TInput
  ): Promise<TOutput> {
    const instance = this.instances.get(id)!;
    instance.status = 'RUNNING';

    const context: WorkflowContext = {
      run: async <T>(stepName: string, fn: () => Promise<T> | T): Promise<T> => {
        instance.history.push({
          stepName,
          type: 'RUN',
          status: 'START',
          timestamp: Date.now(),
        });

        try {
          const result = await fn();
          const lastIdx = instance.history.map((h) => h.stepName).lastIndexOf(stepName);
          if (lastIdx !== -1) {
            instance.history[lastIdx] = {
              stepName,
              type: 'RUN',
              status: 'SUCCESS',
              result,
              timestamp: Date.now(),
            };
          }
          return result;
        } catch (error: any) {
          const lastIdx = instance.history.map((h) => h.stepName).lastIndexOf(stepName);
          if (lastIdx !== -1) {
            instance.history[lastIdx] = {
              stepName,
              type: 'RUN',
              status: 'FAILED',
              result: error?.message ?? String(error),
              timestamp: Date.now(),
            };
          }
          throw error;
        }
      },
      sleep: async (stepName: string, seconds: number): Promise<void> => {
        instance.history.push({
          stepName,
          type: 'SLEEP',
          status: 'START',
          timestamp: Date.now(),
        });

        await new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));

        const lastIdx = instance.history.map((h) => h.stepName).lastIndexOf(stepName);
        if (lastIdx !== -1) {
          instance.history[lastIdx] = {
            stepName,
            type: 'SLEEP',
            status: 'SUCCESS',
            timestamp: Date.now(),
          };
        }
      },
    };

    try {
      const output = await workflow(context, input);
      instance.status = 'COMPLETED';
      instance.output = output;
      return output;
    } catch (error: any) {
      instance.status = 'FAILED';
      instance.error = error?.message ?? String(error);
      throw error;
    }
  }
}
