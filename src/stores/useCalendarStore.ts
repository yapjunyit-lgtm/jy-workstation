import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId, todayISO } from '../lib/utils';
import type { TimeBlock, BlockType } from '../lib/types';
import { BLOCK_COLORS } from '../lib/constants';
import { registerStoreRefresh } from '../lib/store-refresh';

interface CalendarState {
  blocks: TimeBlock[];
  currentWeekStart: string;
  loading: boolean;

  hydrate: (silent?: boolean) => Promise<void>;
  addBlock: (date: string, startHour: number, endHour: number, type: BlockType, label?: string) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  blocks: [],
  currentWeekStart: todayISO(),
  loading: false,

  hydrate: async (silent) => {
    if (!silent) set({ loading: true });
    const blocks = await db.timeBlocks.toArray();
    set({ blocks, loading: false });
  },

  addBlock: async (date, startHour, endHour, type, label) => {
    const block: TimeBlock = {
      id: generateId(),
      date,
      startHour,
      endHour,
      type,
      label: label || type.replace('-', ' '),
      color: BLOCK_COLORS[type] || BLOCK_COLORS['custom'],
    };
    await db.timeBlocks.add(block);
    set((s) => ({ blocks: [...s.blocks, block] }));
  },

  removeBlock: async (id) => {
    await db.timeBlocks.delete(id);
    set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) }));
  },
}));

registerStoreRefresh('timeBlocks', () => { useCalendarStore.getState().hydrate(true); });
