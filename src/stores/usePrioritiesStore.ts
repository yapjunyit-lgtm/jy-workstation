import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId, todayISO } from '../lib/utils';
import type { Priority } from '../lib/types';

interface PrioritiesState {
  priorities: Priority[];
  date: string;
  loading: boolean;

  setDate: (date: string) => void;
  hydrate: (date: string) => Promise<void>;
  add: (title: string, rank: 1 | 2 | 3) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (id: string, newRank: 1 | 2 | 3) => Promise<void>;
}

export const usePrioritiesStore = create<PrioritiesState>((set, get) => ({
  priorities: [],
  date: todayISO(),
  loading: false,

  setDate: (date) => {
    set({ date });
    get().hydrate(date);
  },

  hydrate: async (date) => {
    set({ loading: true });
    const items = await db.priorities.where('date').equals(date).sortBy('rank');
    set({ priorities: items, loading: false });
  },

  add: async (title, rank) => {
    const { date } = get();
    const item: Priority = {
      id: generateId(),
      date,
      rank,
      title,
      completed: false,
      createdAt: Date.now(),
    };
    await db.priorities.add(item);
    set((s) => ({ priorities: [...s.priorities, item].sort((a, b) => a.rank - b.rank) }));
  },

  toggle: async (id) => {
    const item = get().priorities.find((p) => p.id === id);
    if (!item) return;
    await db.priorities.update(id, { completed: !item.completed });
    set((s) => ({
      priorities: s.priorities.map((p) =>
        p.id === id ? { ...p, completed: !p.completed } : p
      ),
    }));
  },

  remove: async (id) => {
    await db.priorities.delete(id);
    set((s) => ({ priorities: s.priorities.filter((p) => p.id !== id) }));
  },

  reorder: async (id, newRank) => {
    const old = get().priorities.find((p) => p.id === id);
    if (!old) return;
    const swapped = get().priorities.find((p) => p.rank === newRank);
    if (swapped) {
      await db.priorities.update(swapped.id, { rank: old.rank });
    }
    await db.priorities.update(id, { rank: newRank });
    set((s) => ({
      priorities: s.priorities
        .map((p) => {
          if (p.id === id) return { ...p, rank: newRank };
          if (swapped && p.id === swapped.id) return { ...p, rank: old.rank };
          return p;
        })
        .sort((a, b) => a.rank - b.rank),
    }));
  },
}));
