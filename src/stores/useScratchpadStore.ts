import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId, todayISO } from '../lib/utils';
import type { ScratchNote } from '../lib/types';

interface ScratchpadState {
  note: ScratchNote | null;
  loading: boolean;

  loadToday: () => Promise<void>;
  save: (content: string, plainText: string) => Promise<void>;
}

export const useScratchpadStore = create<ScratchpadState>((set, get) => ({
  note: null,
  loading: false,

  loadToday: async () => {
    const date = todayISO();
    set({ loading: true });
    let note = await db.scratchNotes.where('date').equals(date).first();
    if (!note) {
      note = {
        id: generateId(),
        date,
        content: '',
        plainText: '',
        updatedAt: Date.now(),
      };
      await db.scratchNotes.add(note);
    }
    set({ note, loading: false });
  },

  save: async (content, plainText) => {
    const note = get().note;
    if (!note) return;
    const updated = { ...note, content, plainText, updatedAt: Date.now() };
    await db.scratchNotes.update(note.id, updated);
    set({ note: updated });
  },
}));
