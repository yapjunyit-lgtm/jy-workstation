import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId } from '../lib/utils';
import type { KanbanTask, KanbanColumn, TaskCategory, Subtask } from '../lib/types';
import { registerStoreRefresh } from '../lib/store-refresh';

interface KanbanState {
  tasks: KanbanTask[];
  filterCategories: TaskCategory[];
  loading: boolean;

  hydrate: (silent?: boolean) => Promise<void>;
  setFilter: (categories: TaskCategory[]) => void;
  add: (task: Partial<KanbanTask>) => Promise<KanbanTask>;
  update: (id: string, patch: Partial<KanbanTask>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  moveTask: (id: string, toColumn: KanbanColumn) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  get filtered(): KanbanTask[];
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  tasks: [],
  filterCategories: [],
  loading: false,

  hydrate: async (silent) => {
    if (!silent) set({ loading: true });
    const tasks = await db.kanbanTasks.toArray();
    set({ tasks, loading: false });
  },

  setFilter: (categories) => set({ filterCategories: categories }),

  add: async (partial) => {
    const now = Date.now();
    const task: KanbanTask = {
      id: generateId(),
      title: partial.title || 'New Task',
      column: partial.column || 'backlog',
      category: partial.category || 'ai-tooling',
      priority: partial.priority || 3,
      subtasks: [],
      securityReviewPassed: false,
      createdAt: now,
      updatedAt: now,
      ...partial,
    };
    await db.kanbanTasks.add(task);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  update: async (id, patch) => {
    await db.kanbanTasks.update(id, { ...patch, updatedAt: Date.now() });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
    }));
  },

  remove: async (id) => {
    await db.kanbanTasks.delete(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  moveTask: async (id, toColumn) => {
    await db.kanbanTasks.update(id, { column: toColumn, updatedAt: Date.now() });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, column: toColumn, updatedAt: Date.now() } : t)),
    }));
  },

  addSubtask: async (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtask: Subtask = { id: generateId(), title, done: false };
    const subtasks = [...task.subtasks, subtask];
    await db.kanbanTasks.update(taskId, { subtasks, updatedAt: Date.now() });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, subtasks, updatedAt: Date.now() } : t)),
    }));
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    await db.kanbanTasks.update(taskId, { subtasks, updatedAt: Date.now() });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, subtasks, updatedAt: Date.now() } : t)),
    }));
  },

  get filtered() {
    const { tasks, filterCategories } = get();
    if (filterCategories.length === 0) return tasks;
    return tasks.filter((t) => filterCategories.includes(t.category));
  },
}));

registerStoreRefresh('kanbanTasks', () => { useKanbanStore.getState().hydrate(true); });
