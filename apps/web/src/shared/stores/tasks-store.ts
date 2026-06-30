import { useSyncExternalStore } from 'react';
import { create } from 'zustand';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const STORAGE_KEY = 'pumni_dashboard_tasks';
export const TASKS_UPDATED_EVENT = 'pumni_dashboard_tasks_updated';

export const DEFAULT_TASKS: Task[] = [
  { id: '1', text: 'Start a Watch Together room', completed: false },
  { id: '2', text: 'Test C-Major scale on Sky Player', completed: false },
  { id: '3', text: 'Customize workspace appearance settings', completed: false },
];

function readTasksFromStorage(): Task[] {
  if (typeof window === 'undefined') return DEFAULT_TASKS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_TASKS;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

function writeTasksToStorage(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event(TASKS_UPDATED_EVENT));
  } catch {
    // Ignore quota / private mode issues
  }
}

interface TasksState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  sync: () => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: readTasksFromStorage(),
  setTasks: (tasks) => {
    writeTasksToStorage(tasks);
    set({ tasks });
  },
  addTask: (text) => {
    set((state) => {
      const newTask: Task = {
        id: crypto.randomUUID(),
        text,
        completed: false,
      };
      const next = [...state.tasks, newTask];
      writeTasksToStorage(next);
      return { tasks: next };
    });
  },
  toggleTask: (id) => {
    set((state) => {
      const next = state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      );
      writeTasksToStorage(next);
      return { tasks: next };
    });
  },
  deleteTask: (id) => {
    set((state) => {
      const next = state.tasks.filter((task) => task.id !== id);
      writeTasksToStorage(next);
      return { tasks: next };
    });
  },
  sync: () => {
    set({ tasks: readTasksFromStorage() });
  },
}));

// Sync cross-tab/window storage updates dynamically.
// On each HMR, the module re-evaluates and creates a fresh Zustand store.
// We must remove listeners from the previous evaluation and register new
// ones that reference the current store, without accumulating duplicates.
if (typeof window !== 'undefined') {
  const CLEANUP = Symbol.for('pumni.tasks.sync.cleanup');
  const w = window as unknown as Record<symbol, unknown>;
  const prevCleanup = w[CLEANUP];
  if (typeof prevCleanup === 'function') prevCleanup();

  const handleSync = () => {
    useTasksStore.getState().sync();
  };
  window.addEventListener('storage', handleSync);
  window.addEventListener('focus', handleSync);
  window.addEventListener(TASKS_UPDATED_EVENT, handleSync);

  (w as Record<symbol, () => void>)[CLEANUP] = () => {
    window.removeEventListener('storage', handleSync);
    window.removeEventListener('focus', handleSync);
    window.removeEventListener(TASKS_UPDATED_EVENT, handleSync);
  };
}

/**
 * Hydration-safe React hook to consume tasks client-side.
 * Resolves to the `serverDefault` during SSR / initial hydration and
 * safely updates to client state once mounted without triggering layout shifts.
 */
export function useTasks(serverDefault: Task[] = []): Task[] {
  return useSyncExternalStore(
    useTasksStore.subscribe,
    () => useTasksStore.getState().tasks,
    () => serverDefault,
  );
}
