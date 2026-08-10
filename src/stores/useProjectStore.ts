import { create } from 'zustand';
import { db } from '../lib/db';
import { registerStoreRefresh } from '../lib/store-refresh';
import type { ProjectInfo } from '../lib/types';

const DEFAULT_INFO: ProjectInfo = {
  id: 'project',
  name: '',
  description: '',
  author: '',
  updatedAt: 0,
};

interface ProjectState {
  info: ProjectInfo;
  loading: boolean;

  hydrate: (silent?: boolean) => Promise<void>;
  save: (patch: Partial<Omit<ProjectInfo, 'id'>>) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  info: DEFAULT_INFO,
  loading: false,

  hydrate: async (silent) => {
    if (!silent) set({ loading: true });
    const rec = await db.projectInfo.get('project').catch(() => undefined);
    if (rec) set({ info: rec, loading: false });
    else set({ loading: false });
  },

  save: async (patch) => {
    const next: ProjectInfo = { ...get().info, ...patch, updatedAt: Date.now() };
    await db.projectInfo.put(next);
    set({ info: next });
  },
}));

registerStoreRefresh('projectInfo', () => useProjectStore.getState().hydrate(true));
