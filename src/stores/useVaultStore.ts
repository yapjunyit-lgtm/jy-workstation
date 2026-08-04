import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId } from '../lib/utils';
import type { Snippet, DataSource, ChecklistItem } from '../lib/types';

interface VaultState {
  snippets: Snippet[];
  dataSources: DataSource[];
  checklist: ChecklistItem[];
  loading: boolean;

  hydrate: () => Promise<void>;
  addSnippet: (s: Partial<Snippet>) => Promise<void>;
  updateSnippet: (id: string, patch: Partial<Snippet>) => Promise<void>;
  removeSnippet: (id: string) => Promise<void>;
  addDataSource: (ds: Partial<DataSource>) => Promise<void>;
  updateDataSource: (id: string, patch: Partial<DataSource>) => Promise<void>;
  removeDataSource: (id: string) => Promise<void>;
  toggleChecklistItem: (id: string) => Promise<void>;
  resetChecklist: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  snippets: [],
  dataSources: [],
  checklist: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const [snippets, dataSources, checklist] = await Promise.all([
        db.snippets.toArray().then(arr => arr.sort((a, b) => b.createdAt - a.createdAt)),
        db.dataSources.toArray(),
        db.checklistItems.toArray(),
      ]);
      set({ snippets, dataSources, checklist, loading: false });
    } catch (e) {
      console.error('Vault hydrate failed:', e);
      set({ loading: false });
    }
  },

  addSnippet: async (partial) => {
    const snippet: Snippet = {
      id: generateId(),
      title: partial.title || 'Untitled',
      content: partial.content || '',
      category: partial.category || 'python-wrangling',
      tags: partial.tags || [],
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.snippets.add(snippet);
    set((s) => ({ snippets: [snippet, ...s.snippets] }));
  },

  updateSnippet: async (id, patch) => {
    await db.snippets.update(id, { ...patch, updatedAt: Date.now() });
    set((s) => ({ snippets: s.snippets.map((sn) => (sn.id === id ? { ...sn, ...patch, updatedAt: Date.now() } : sn)) }));
  },

  removeSnippet: async (id) => {
    await db.snippets.delete(id);
    set((s) => ({ snippets: s.snippets.filter((sn) => sn.id !== id) }));
  },

  addDataSource: async (partial) => {
    const ds: DataSource = {
      id: generateId(),
      name: partial.name || 'Untitled',
      type: partial.type || 'sql-table',
      notes: partial.notes || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...partial,
    };
    await db.dataSources.add(ds);
    set((s) => ({ dataSources: [...s.dataSources, ds] }));
  },

  updateDataSource: async (id, patch) => {
    await db.dataSources.update(id, { ...patch, updatedAt: Date.now() });
    set((s) => ({ dataSources: s.dataSources.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)) }));
  },

  removeDataSource: async (id) => {
    await db.dataSources.delete(id);
    set((s) => ({ dataSources: s.dataSources.filter((d) => d.id !== id) }));
  },

  toggleChecklistItem: async (id) => {
    const item = get().checklist.find((c) => c.id === id);
    if (!item) return;
    await db.checklistItems.update(id, { checked: !item.checked });
    set((s) => ({
      checklist: s.checklist.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
    }));
  },

  resetChecklist: async () => {
    const { checklist } = get();
    await Promise.all(checklist.map((c) => db.checklistItems.update(c.id, { checked: false })));
    set((s) => ({ checklist: s.checklist.map((c) => ({ ...c, checked: false })) }));
  },
}));
