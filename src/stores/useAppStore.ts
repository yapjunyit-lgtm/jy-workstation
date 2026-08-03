import { create } from 'zustand';
import type { Theme } from '../lib/types';

interface AppState {
  theme: Theme;
  sidebarCollapsed: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light-sakura',
  sidebarCollapsed: false,

  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
