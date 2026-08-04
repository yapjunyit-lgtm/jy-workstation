import { useState, useEffect } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useBlockerStore } from '../../stores/useBlockerStore';
import type { BlockerStatus } from '../../lib/types';

type Severity = 'high' | 'med' | 'low';


const SEVERITY_COLORS: Record<Severity, { border: string; bg: string }> = {
  high: { border: 'var(--danger)', bg: 'rgba(196,136,124,0.08)' },
  med:  { border: 'var(--warning)', bg: 'rgba(201,169,110,0.08)' },
  low:  { border: 'var(--accent)', bg: 'rgba(139,157,131,0.08)' },
};

const STATUS_OPTIONS: { value: BlockerStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
];

export function BlockerTracker() {
  const { blockers, loading, hydrate, add, updateStatus, remove } = useBlockerStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<Severity>('med');
  const [owner, setOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState<BlockerStatus | 'all'>('all');

  useEffect(() => { hydrate(); }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await add(title.trim(), `Owner: ${owner || 'self'} · Severity: ${severity}`);
    setTitle(''); setOwner(''); setShowForm(false);
  };

  const filtered = filterStatus === 'all'
    ? blockers
    : blockers.filter((b) => b.status === filterStatus);

  const openCount = blockers.filter((b) => b.status !== 'resolved').length;

  return (
    <div className="card-static space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />
          <h3 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Blockers
          </h3>
          {openCount > 0 && (
            <span className="badge badge-danger">{openCount}</span>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-sakura btn-ghost btn-sm" data-add-blocker>
          <Plus size={14} /> <span className="text-xs">Log</span>
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="space-y-2 p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's blocking you?"
            className="input-sakura text-sm"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }}
          />
          <div className="flex items-center gap-2">
            <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className="input-sakura text-sm" style={{ width: 100 }}>
              <option value="high">High</option>
              <option value="med">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner"
              className="input-sakura text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} className="btn-sakura btn-primary btn-sm">Add</button>
            <button onClick={() => setShowForm(false)} className="btn-sakura btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-1.5">
        {(['all', 'open', 'escalated', 'resolved'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="text-[11px] px-2 py-0.5 rounded-full transition-soft border"
            style={{
              color: filterStatus === s ? 'var(--text-primary)' : 'var(--text-muted)',
              background: filterStatus === s ? 'var(--bg-subtle)' : 'transparent',
              borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border-color)',
            }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No blockers — nice.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => {
            const sev = (b.description?.includes('High') ? 'high' : b.description?.includes('Medium') ? 'med' : 'low') as Severity;
            const sevStyle = SEVERITY_COLORS[sev];
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-soft"
                style={{
                  background: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  borderLeft: `3px solid ${sevStyle.border}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] truncate" style={{ color: 'var(--text-primary)' }}>{b.title}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    Severity: {sev} · {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b.id, e.target.value as BlockerStatus)}
                    className="text-[11px] rounded px-2 py-1 border"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      width: 100,
                    }}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove(b.id)}
                    className="text-xs px-1.5 py-0.5 rounded transition-soft"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
