import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId, todayISO } from '../lib/utils';
import { registerStoreRefresh } from '../lib/store-refresh';
import type { QuickNote } from '../lib/types';

interface QuickNotesState {
  notes: QuickNote[];
  date: string;
  loading: boolean;

  hydrate: (date: string, silent?: boolean) => Promise<void>;
  add: (content: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useQuickNotesStore = create<QuickNotesState>((set, get) => ({
  notes: [],
  date: todayISO(),
  loading: false,

  hydrate: async (date, silent) => {
    if (!silent) set({ loading: true });
    const notes = await db.quickNotes
      .where('date').equals(date)
      .reverse()
      .sortBy('createdAt');
    set({ notes: notes.reverse(), date, loading: false });
  },

  add: async (content) => {
    const note: QuickNote = {
      id: generateId(),
      date: get().date,
      content: content.trim(),
      createdAt: Date.now(),
    };
    await db.quickNotes.add(note);
    set((s) => ({ notes: [...s.notes, note] }));
  },

  remove: async (id) => {
    await db.quickNotes.delete(id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },
}));

registerStoreRefresh('quickNotes', () => {
  const st = useQuickNotesStore.getState();
  st.hydrate(st.date, true);
});
