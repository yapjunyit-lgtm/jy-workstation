import { create } from 'zustand';
import { db } from '../lib/db';
import { generateId } from '../lib/utils';
import type { AIConversation, AIChatMessage } from '../lib/types';
import { registerStoreRefresh } from '../lib/store-refresh';

interface AIConversationState {
  conversations: AIConversation[];
  activeId: string | null;
  loading: boolean;

  hydrate: (silent?: boolean) => Promise<void>;
  selectConversation: (id: string) => void;
  newConversation: () => Promise<AIConversation>;
  deleteConversation: (id: string) => Promise<void>;
  appendMessage: (
    conversationId: string,
    message: Omit<AIChatMessage, 'id' | 'createdAt'>
  ) => Promise<void>;
}

const TITLE_MAX = 48;

export const useAIConversationStore = create<AIConversationState>((set, get) => ({
  conversations: [],
  activeId: null,
  loading: false,

  hydrate: async (silent) => {
    if (!silent) set({ loading: true });
    const items = await db.aiConversations
      .orderBy('updatedAt')
      .reverse()
      .toArray()
      .catch((e) => {
        console.error('[aiConversations] hydrate failed', e);
        return [];
      });
    set((s) => ({
      conversations: items,
      loading: false,
      activeId:
        s.activeId && items.some((c) => c.id === s.activeId)
          ? s.activeId
          : (items[0]?.id ?? null),
    }));
  },

  selectConversation: (id) => set({ activeId: id }),

  newConversation: async () => {
    const now = Date.now();
    const conv: AIConversation = {
      id: generateId(),
      title: 'New conversation',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    await db.aiConversations.add(conv);
    set((s) => ({
      conversations: [conv, ...s.conversations],
      activeId: conv.id,
    }));
    return conv;
  },

  deleteConversation: async (id) => {
    await db.aiConversations.delete(id);
    set((s) => {
      const remaining = s.conversations.filter((c) => c.id !== id);
      return {
        conversations: remaining,
        activeId: s.activeId === id ? (remaining[0]?.id ?? null) : s.activeId,
      };
    });
  },

  appendMessage: async (conversationId, message) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const msg: AIChatMessage = { ...message, id: generateId(), createdAt: Date.now() };
    const now = Date.now();
    const isFirstUserMessage = conv.messages.length === 0 && msg.role === 'user';
    const title =
      isFirstUserMessage
        ? (msg.text.length > TITLE_MAX ? msg.text.slice(0, TITLE_MAX) + '…' : msg.text)
        : conv.title;
    const updated: AIConversation = {
      ...conv,
      title,
      updatedAt: now,
      messages: [...conv.messages, msg],
    };

    await db.aiConversations.put(updated);
    set((s) => ({
      conversations: s.conversations
        .map((c) => (c.id === conversationId ? updated : c))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    }));
  },
}));

registerStoreRefresh('aiConversations', () => {
  useAIConversationStore.getState().hydrate(true);
});
