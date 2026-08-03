import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId } from '../lib/utils';
import type { STAREntry, SOPDocument, SOPStatus } from '../lib/types';

interface ImpactState {
  starEntries: STAREntry[];
  sopDocuments: SOPDocument[];
  loading: boolean;

  hydrate: () => Promise<void>;
  addStar: (entry: Omit<STAREntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStar: (id: string, patch: Partial<STAREntry>) => Promise<void>;
  removeStar: (id: string) => Promise<void>;
  addSOP: (title: string) => Promise<void>;
  updateSOPStatus: (id: string, status: SOPStatus) => Promise<void>;
  removeSOP: (id: string) => Promise<void>;
}

export const useImpactStore = create<ImpactState>((set) => ({
  starEntries: [],
  sopDocuments: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    const [starEntries, sopDocuments] = await Promise.all([
      db.starEntries.orderBy('createdAt').reverse().toArray(),
      db.sopDocuments.orderBy('lastEdited').reverse().toArray(),
    ]);
    set({ starEntries, sopDocuments, loading: false });
  },

  addStar: async (entry) => {
    const now = Date.now();
    const star: STAREntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now };
    await db.starEntries.add(star);
    set((s) => ({ starEntries: [star, ...s.starEntries] }));
  },

  updateStar: async (id, patch) => {
    await db.starEntries.update(id, { ...patch, updatedAt: Date.now() });
    set((s) => ({
      starEntries: s.starEntries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e)),
    }));
  },

  removeStar: async (id) => {
    await db.starEntries.delete(id);
    set((s) => ({ starEntries: s.starEntries.filter((e) => e.id !== id) }));
  },

  addSOP: async (title) => {
    const doc: SOPDocument = { id: generateId(), title, status: 'drafting', lastEdited: Date.now() };
    await db.sopDocuments.add(doc);
    set((s) => ({ sopDocuments: [doc, ...s.sopDocuments] }));
  },

  updateSOPStatus: async (id, status) => {
    await db.sopDocuments.update(id, { status, lastEdited: Date.now() });
    set((s) => ({
      sopDocuments: s.sopDocuments.map((d) => (d.id === id ? { ...d, status, lastEdited: Date.now() } : d)),
    }));
  },

  removeSOP: async (id) => {
    await db.sopDocuments.delete(id);
    set((s) => ({ sopDocuments: s.sopDocuments.filter((d) => d.id !== id) }));
  },
}));
