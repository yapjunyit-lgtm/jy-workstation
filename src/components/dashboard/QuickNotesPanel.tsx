import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useQuickNotesStore } from '../../stores/useQuickNotesStore';
import { formatTime } from '../../lib/utils';
import { Skeleton } from '../layout/Skeleton';

export function QuickNotesPanel() {
  const { notes, date, loading, hydrate, add, remove } = useQuickNotesStore();
  const [draft, setDraft] = useState('');

  useEffect(() => {
    hydrate(date);
  }, [date]);

  const handleAdd = () => {
    if (!draft.trim()) return;
    add(draft);
    setDraft('');
  };

  return (
    <div className="card-static space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} style={{ color: 'var(--warning)' }} />
        <h3 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Quick Note
        </h3>
        <span className="ml-auto text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {notes.length}
        </span>
      </div>

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        placeholder="Capture an idea… ⏎"
        className="input-sakura text-xs"
        aria-label="Quick note"
      />

      {loading ? (
        <div className="space-y-1.5">
          <Skeleton height={28} />
          <Skeleton height={28} width="80%" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          No notes yet — jot anything down, it syncs to every device.
        </p>
      ) : (
        <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5" style={{ overscrollBehavior: 'contain' }}>
          {notes.slice().reverse().map((n) => (
            <div
              key={n.id}
              className="group flex items-start gap-1.5 py-1.5 px-2 rounded-lg transition-soft"
              style={{ background: 'var(--bg-subtle)' }}
            >
              <span className="text-[10px] font-mono flex-shrink-0 pt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {formatTime(n.createdAt)}
              </span>
              <span className="text-xs flex-1 break-words leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {n.content}
              </span>
              <button
                onClick={() => remove(n.id)}
                className="opacity-0 group-hover:opacity-100 transition-soft flex-shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
                title="Delete note"
                aria-label="Delete note"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
