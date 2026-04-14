import { create } from 'zustand';
import type { Task, TaskStatus } from '@/types/task';

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface FetchTasksParams {
  status?: TaskStatus;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

interface TaskStore {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (params?: FetchTasksParams) => Promise<void>;
  addTask: (data: Partial<Task> & { title: string }) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;

  // Internal helpers used by the realtime hook
  _addTaskToStore: (task: Task) => void;
  _updateTaskInStore: (task: Task) => void;
  _removeTaskFromStore: (id: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  // ---------------------------------------------------------------------------
  fetchTasks: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const qs = new URLSearchParams();
      if (params.status) qs.set('status', params.status);
      if (params.search) qs.set('search', params.search);
      if (params.sort) qs.set('sort', params.sort);
      if (params.page != null) qs.set('page', String(params.page));
      if (params.limit != null) qs.set('limit', String(params.limit));

      const res = await fetch(`/api/tasks?${qs.toString()}`);
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to fetch tasks');
      }

      const data = await res.json() as TasksResponse;
      set({ tasks: data.tasks, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
      set({ error: message, isLoading: false });
    }
  },

  // ---------------------------------------------------------------------------
  addTask: async (data) => {
    const optimisticTask: Task = {
      id: `optimistic-${Date.now()}`,
      userId: '',
      title: data.title,
      description: data.description,
      status: 'pending',
      priority: data.priority ?? 3,
      tags: data.tags ?? [],
      dueAt: data.dueAt,
      person: data.person,
      place: data.place,
      sessionId: data.sessionId,
      intentId: data.intentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({ tasks: [optimisticTask, ...state.tasks] }));

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to create task');
      }

      const { task } = await res.json() as { task: Task };

      // Replace the optimistic entry with the real one
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === optimisticTask.id ? task : t
        ),
      }));

      return task;
    } catch (err) {
      // Roll back the optimistic insert
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== optimisticTask.id),
        error: err instanceof Error ? err.message : 'Failed to create task',
      }));
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  updateTask: async (id, data) => {
    const previous = get().tasks;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      ),
    }));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to update task');
      }

      const { task } = await res.json() as { task: Task };

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? task : t)),
      }));

      return task;
    } catch (err) {
      // Roll back
      set({ tasks: previous, error: err instanceof Error ? err.message : 'Failed to update task' });
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  deleteTask: async (id) => {
    const previous = get().tasks;

    // Optimistic removal
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to delete task');
      }
    } catch (err) {
      // Roll back
      set({ tasks: previous, error: err instanceof Error ? err.message : 'Failed to delete task' });
      throw err;
    }
  },

  // ---------------------------------------------------------------------------
  setTaskStatus: async (id, status) => {
    await get().updateTask(id, { status });
  },

  // ---------------------------------------------------------------------------
  // Realtime helpers (called by useRealtimeTasks hook)
  _addTaskToStore: (task) => {
    set((state) => {
      // Avoid duplicates
      if (state.tasks.some((t) => t.id === task.id)) return state;
      return { tasks: [task, ...state.tasks] };
    });
  },

  _updateTaskInStore: (task) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
  },

  _removeTaskFromStore: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },
}));
