import { create } from 'zustand';
import { db } from '../lib/db';
import type { SyncConfig } from '../lib/types';

interface SyncState {
  config: SyncConfig;
  isExporting: boolean;

  hydrate: () => Promise<void>;
  updateConfig: (patch: Partial<SyncConfig>) => Promise<void>;
  setExporting: (v: boolean) => void;
}

const DEFAULT_CONFIG: Omit<SyncConfig, 'id'> = {
  vaultName: 'JY',
  dailyNoteFolder: 'Daily Notes',
  starFolder: 'STAR Entries',
  autoExportEnabled: false,
  autoExportInterval: 60,
  lastExportAt: null,
};

export const useSyncStore = create<SyncState>((set) => ({
  config: { id: 'default', ...DEFAULT_CONFIG },
  isExporting: false,

  hydrate: async () => {
    let config = await db.syncConfig.get('default');
    if (!config) {
      config = { id: 'default', ...DEFAULT_CONFIG };
      await db.syncConfig.add(config);
    }
    set({ config });
  },

  updateConfig: async (patch) => {
    await db.syncConfig.update('default', patch);
    set((s) => ({ config: { ...s.config, ...patch } }));
  },

  setExporting: (v) => set({ isExporting: v }),
}));
