import { create } from 'zustand';

interface CloudStatusState {
  email: string | null;
  setEmail: (email: string | null) => void;
}

/** Tiny store so the TopBar can show per-browser cloud sync state. */
export const useCloudStatusStore = create<CloudStatusState>((set) => ({
  email: null,
  setEmail: (email) => set({ email }),
}));
