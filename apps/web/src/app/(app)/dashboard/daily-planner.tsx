'use client';

import * as React from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@pumni/ui/form';
import { cn } from '@pumni/ui/lib/cn';

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

const STORAGE_KEY = 'pumni_dashboard_tasks';

/** Custom event dispatched after writing tasks so the metric card stays in sync. */
const TASKS_UPDATED_EVENT = 'pumni:dashboard-tasks-updated';

const DEFAULT_TASKS: Task[] = [
  { id: '1', text: 'Start a Watch Together room', completed: false },
  { id: '2', text: 'Test C-Major scale on Sky Player', completed: false },
  { id: '3', text: 'Customize workspace appearance settings', completed: false },
];

export function DailyPlanner() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = React.useState('');
  const [mounted, setMounted] = React.useState(false);

  // Load tasks on mount
  React.useEffect(() => {
    let initialTasks = DEFAULT_TASKS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          initialTasks = parsed as Task[];
        }
      }
    } catch {
      initialTasks = DEFAULT_TASKS;
    }

    const timer = setTimeout(() => {
      setTasks(initialTasks);
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Persist tasks on changes
  const saveTasks = React.useCallback((next: Task[]) => {
    setTasks(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(TASKS_UPDATED_EVENT));
    } catch {
      // Ignore — storage may be unavailable (private mode, quota).
    }
  }, []);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskText.trim();
    if (!text) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
    };
    saveTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    saveTasks(
      tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    );
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter((task) => task.id !== id));
  };

  if (!mounted) {
    return (
      <div className="flex h-full flex-col justify-between gap-4 motion-safe:animate-pulse">
        <div className="h-5 w-40 rounded-md bg-muted" />
        <div className="space-y-2">
          <div className="h-10 rounded-md bg-muted" />
          <div className="h-10 rounded-md bg-muted" />
          <div className="h-10 rounded-md bg-muted" />
        </div>
        <div className="h-9 rounded-md bg-muted" />
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="type-caption font-semibold tracking-wider text-muted-foreground uppercase">
            Progress
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
            aria-label={`${completedCount} of ${tasks.length} tasks done`}
          >
            {completedCount}/{tasks.length} done
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 w-32 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Daily tasks progress"
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via) transition-[width] duration-(--duration-slow) ease-snappy"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            All tasks completed — add one to keep momentum.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/30"
            >
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                aria-pressed={task.completed}
                aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                className="flex flex-1 items-center gap-2.5 text-left"
              >
                <span
                  className={cn(
                    'inline-flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                    task.completed
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background',
                  )}
                >
                  {task.completed ? <Check className="size-3 stroke-3" /> : null}
                </span>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    task.completed
                      ? 'text-muted-foreground line-through decoration-muted-foreground/60'
                      : 'text-foreground',
                  )}
                >
                  {task.text}
                </span>
              </button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => deleteTask(task.id)}
                aria-label={`Delete task "${task.text}"`}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Add a new task…"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          variant="filled"
          className="flex-1"
          aria-label="New task description"
        />
        <Button type="submit" size="icon" aria-label="Add task">
          <Plus className="size-4" />
        </Button>
      </form>
    </div>
  );
}
