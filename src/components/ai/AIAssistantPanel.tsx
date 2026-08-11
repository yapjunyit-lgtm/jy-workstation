import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CheckCircle2, XCircle, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Dots } from '../layout/Dots';
import { runAssistant, type AssistantAction } from '../../lib/bridge';
import { useAIConversationStore } from '../../stores/useAIConversationStore';
import type { AIChatAction } from '../../lib/types';
import { formatTimeIntl, formatDateIntl } from '../../lib/utils';

const SUGGESTIONS = [
  'Create a kanban task for me',
  'Add a calendar event tomorrow 2pm–3pm',
  'What is overdue on my board?',
  'Summarize my week ahead',
  'Am I balancing work and study well?',
];

function renderRich(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="font-family:JetBrains Mono,monospace;font-size:11px;background:var(--bg-subtle);padding:1px 4px;border-radius:3px;">$1</code>')
    .replace(/\n/g, '<br/>');
}

export function AIAssistantPanel() {
  const {
    conversations, activeId, selectConversation,
    newConversation, deleteConversation, appendMessage,
  } = useAIConversationStore();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [liveActions, setLiveActions] = useState<AssistantAction[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  useEffect(() => {
    const st = useAIConversationStore.getState();
    st.hydrate().then(() => {
      const s = useAIConversationStore.getState();
      if (s.conversations.length === 0) s.newConversation();
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveActions, busy]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setBusy(true);
    setLiveActions([]);

    let convId = useAIConversationStore.getState().activeId;
    if (!convId) {
      const conv = await useAIConversationStore.getState().newConversation();
      convId = conv.id;
    }
    await appendMessage(convId, { role: 'user', text: message });

    try {
      const final = await runAssistant(message, {
        onEvent: (e) => {
          if (e.type === 'action') {
            setLiveActions((prev) => [...prev, {
              op: e.op || 'action',
              ok: e.ok === true,
              id: e.id,
              title: e.title,
              error: e.error,
              date: e.date,
              start: e.start,
              end: e.end,
            }]);
          }
        },
      });
      const actions = final.actions as AssistantAction[] | undefined;
      await appendMessage(convId, {
        role: 'assistant',
        text: final.answer || (final.ok ? 'Done.' : 'The assistant could not complete that.'),
        actions: actions && actions.length ? (actions as AIChatAction[]) : undefined,
      });
    } catch (err) {
      await appendMessage(convId, {
        role: 'assistant',
        text: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
    setBusy(false);
    setLiveActions([]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this conversation?')) deleteConversation(id);
  };

  const relativeTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    return d.toDateString() === now.toDateString() ? formatTimeIntl(ts) : formatDateIntl(ts);
  };

  return (
    <div className="card-static flex" style={{ height: 'calc(100dvh - 230px)', minHeight: 480, padding: 0, overflow: 'hidden' }}>
      {/* Conversation sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 border-r"
        style={{ width: 232, background: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
        aria-label="Conversations"
      >
        <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="button"
            onClick={() => newConversation()}
            disabled={busy}
            className="btn-sakura btn-primary btn-sm w-full"
          >
            <Plus size={13} aria-hidden="true" /> New Conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" style={{ overscrollBehavior: 'contain' }}>
          {conversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <div
                key={c.id}
                className="flex items-center gap-1 rounded-lg px-1.5 py-1.5"
                style={{
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-card-contact)' : 'none',
                  border: '1px solid ' + (isActive ? 'var(--border-strong)' : 'transparent'),
                }}
              >
                <button
                  type="button"
                  onClick={() => selectConversation(c.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  style={{ background: 'transparent', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: 0 }}
                  aria-label={`Open conversation: ${c.title}`}
                >
                  <MessageSquare size={12} style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-xs truncate" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400 }}>
                      {c.messages.length === 0 ? 'New conversation' : c.title}
                    </span>
                    <span className="block text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {relativeTime(c.updatedAt)} · {c.messages.length} msg
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="flex-shrink-0 p-1 rounded-full"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                  aria-label={`Delete conversation: ${c.title}`}
                >
                  <Trash2 size={11} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Chat column */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {active?.messages.length ? active.title : 'New conversation'}
          </span>
          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
            {messages.length} messages
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 p-4" style={{ overscrollBehavior: 'contain' }}>
          {messages.length === 0 && !busy && (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                JY Workstation Assistant
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Ask for insights about your data, or have me create tasks, calendar events,
                priorities, and blockers — I write straight to your local database.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} disabled={busy}
                    className="text-xs px-3 py-1.5 rounded-full border transition-soft"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-xl px-3.5 py-2.5"
                style={{
                  background: m.role === 'user' ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  className="text-[13px] leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                  dangerouslySetInnerHTML={{ __html: renderRich(m.text) }}
                />
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.actions.map((a, j) => (
                      <span key={j} className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          background: a.ok ? '#E2EDE4' : '#F3E4E0',
                          color: a.ok ? 'var(--success)' : 'var(--danger)',
                        }}>
                        {a.ok ? <CheckCircle2 size={11} aria-hidden="true" /> : <XCircle size={11} aria-hidden="true" />}
                        {a.ok ? `${a.op}: ${a.title || a.id?.slice(0, 8)}` : `${a.op}: ${a.error || 'failed'}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                <Dots size={13} color="var(--accent)" />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assistant is thinking…</span>
              </div>
            </div>
          )}

          {liveActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-start">
              {liveActions.map((a, j) => (
                <span key={j} className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: a.ok ? '#E2EDE4' : '#F3E4E0',
                    color: a.ok ? 'var(--success)' : 'var(--danger)',
                  }}>
                  {a.ok ? <CheckCircle2 size={11} aria-hidden="true" /> : <XCircle size={11} aria-hidden="true" />}
                  {a.ok ? `✓ ${a.op}: ${a.title || ''}` : `✗ ${a.op}: ${a.error || 'failed'}`}
                </span>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask for insights or make changes… (e.g. “Add a study block tomorrow 9–10”)"
            className="input-sakura text-sm flex-1"
            rows={1}
            disabled={busy}
            aria-label="Message the assistant"
            style={{ resize: 'none', overflowY: 'auto', maxHeight: 140, lineHeight: 1.55 }}
          />
          <button onClick={() => send()} disabled={busy || !input.trim()} className="btn-sakura btn-primary btn-sm" aria-label="Send message">
            {busy ? <Dots size={14} aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
          </button>
        </div>
        <div className="px-3 pb-2 flex items-center gap-1 text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          <Sparkles size={10} aria-hidden="true" />
          Powered by Codex via your local vault bridge — conversations are saved locally and synced.
        </div>
      </div>
    </div>
  );
}
