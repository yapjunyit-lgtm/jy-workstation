import { create } from 'zustand';

interface CloudStatusState {
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

/** TopBar indicator: is the local vault bridge (SQLite) reachable? */
export const useCloudStatusStore = create<CloudStatusState>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));
