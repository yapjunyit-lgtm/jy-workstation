import { create } from 'zustand';
import { fetchICSFeed, type ICSEvent } from '../lib/ics-parser';

interface GCalState {
  icsUrl: string;
  events: ICSEvent[];
  loading: boolean;
  lastFetched: number | null;
  error: string | null;

  setIcsUrl: (url: string) => void;
  loadFromStorage: () => void;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'jy_gcal_ics_url';

export const useGCalStore = create<GCalState>((set, get) => ({
  icsUrl: '',
  events: [],
  loading: false,
  lastFetched: null,
  error: null,

  setIcsUrl: (url: string) => {
    localStorage.setItem(STORAGE_KEY, url);
    set({ icsUrl: url, error: null });
  },

  loadFromStorage: () => {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    set({ icsUrl: saved });
    if (saved) get().refresh();
  },

  refresh: async () => {
    const { icsUrl } = get();
    if (!icsUrl) return;

    set({ loading: true, error: null });
    try {
      const events = await fetchICSFeed(icsUrl);
      set({ events, loading: false, lastFetched: Date.now() });
    } catch (e) {
      set({ loading: false, error: 'Failed to fetch calendar. Check the URL or try again.' });
    }
  },
}));
