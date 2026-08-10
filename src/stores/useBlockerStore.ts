import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId } from '../lib/utils';
import type { Blocker, BlockerStatus } from '../lib/types';
import { registerStoreRefresh } from '../lib/store-refresh';

interface BlockerState {
  blockers: Blocker[];
  loading: boolean;

  hydrate: (silent?: boolean) => Promise<void>;
  add: (title: string, description: string) => Promise<void>;
  updateStatus: (id: string, status: BlockerStatus, resolution?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useBlockerStore = create<BlockerState>((set) => ({
  blockers: [],
  loading: false,

  hydrate: async (silent) => {
    if (!silent) set({ loading: true });
    const arr = await db.blockers.toArray();
    const blockers = arr.sort((a, b) => b.createdAt - a.createdAt);
    set({ blockers, loading: false });
  },

  add: async (title, description) => {
    const blocker: Blocker = {
      id: generateId(),
      title,
      description,
      status: 'open',
      createdAt: Date.now(),
    };
    await db.blockers.add(blocker);
    set((s) => ({ blockers: [blocker, ...s.blockers] }));
  },

  updateStatus: async (id, status, resolution) => {
    const patch: Partial<Blocker> = { status };
    if (status === 'resolved') patch.resolvedAt = Date.now();
    if (resolution) patch.resolution = resolution;
    await db.blockers.update(id, patch);
    set((s) => ({
      blockers: s.blockers.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  },

  remove: async (id) => {
    await db.blockers.delete(id);
    set((s) => ({ blockers: s.blockers.filter((b) => b.id !== id) }));
  },
}));

registerStoreRefresh('blockers', () => { useBlockerStore.getState().hydrate(true); });
