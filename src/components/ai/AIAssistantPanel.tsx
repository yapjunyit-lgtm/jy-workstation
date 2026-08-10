import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { runAssistant, type AssistantAction } from '../../lib/bridge';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  actions?: AssistantAction[];
}

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [liveActions, setLiveActions] = useState<AssistantAction[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveActions]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput('');
    setBusy(true);
    setLiveActions([]);
    setMessages((prev) => [...prev, { role: 'user', text: message }]);

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
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: final.answer || (final.ok ? 'Done.' : 'The assistant could not complete that.'),
        actions: actions && actions.length ? actions : undefined,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: `⚠ ${err instanceof Error ? err.message : String(err)}`,
      }]);
    }
    setBusy(false);
    setLiveActions([]);
  };

  return (
    <div className="card-static flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 && !busy && (
          <div className="text-center py-10 space-y-3">
            <div className="text-3xl">🤖</div>
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

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                      {a.ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
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
              <Loader2 size={13} className="animate-spin" style={{ color: 'var(--accent)' }} />
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
                {a.ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {a.ok ? `✓ ${a.op}: ${a.title || ''}` : `✗ ${a.op}: ${a.error || 'failed'}`}
              </span>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask for insights or make changes… (e.g. “Add a study block tomorrow 9–10”)"
          className="input-sakura text-sm flex-1"
          disabled={busy}
        />
        <button onClick={() => send()} disabled={busy || !input.trim()} className="btn-sakura btn-primary btn-sm">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
      <div className="px-3 pb-2 flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
        <Sparkles size={10} />
        Powered by Codex via your local vault bridge — changes go straight to server/workspace.db
      </div>
    </div>
  );
}
