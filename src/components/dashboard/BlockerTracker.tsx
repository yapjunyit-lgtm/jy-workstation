import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useBlockerStore } from '../../stores/useBlockerStore';
import type { BlockerStatus } from '../../lib/types';

const STATUS_OPTIONS: { value: BlockerStatus; label: string; color: string; bg: string }[] = [
  { value: 'open', label: 'Open', color: 'var(--danger)', bg: '#F3E4E0' },
  { value: 'escalated', label: 'Escalated', color: 'var(--warning)', bg: '#F5EFE4' },
  { value: 'resolved', label: 'Resolved', color: 'var(--success)', bg: '#E2EDE4' },
];

export function BlockerTracker() {
  const { blockers, loading, hydrate, add, updateStatus, remove } = useBlockerStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<BlockerStatus | 'all'>('open');

  useEffect(() => {
    hydrate();
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await add(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredBlockers = filterStatus === 'all'
    ? blockers
    : blockers.filter((b) => b.status === filterStatus);

  const openCount = blockers.filter((b) => b.status !== 'resolved').length;

  return (
    <div className="card-static space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Blockers
          </h3>
          {openCount > 0 && (
            <span className="badge badge-danger">{openCount} open</span>
          )}
        </div>
        <button
          data-add-blocker
          onClick={() => setShowForm(!showForm)}
          className="btn-sakura btn-ghost btn-sm"
        >
          <Plus size={14} />
          <span className="text-xs">Log Blocker</span>
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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details (optional)"
            className="input-sakura text-sm"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} className="btn-sakura btn-primary btn-sm">Log</button>
            <button onClick={() => setShowForm(false)} className="btn-sakura btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      {blockers.length > 0 && (
        <div className="flex items-center gap-1.5">
          {(['all', ...STATUS_OPTIONS.map((s) => s.value)] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className="text-xs px-2 py-0.5 rounded-full transition-soft"
              style={{
                color: filterStatus === status ? 'var(--text-primary)' : 'var(--text-tertiary)',
                background: filterStatus === status ? 'var(--bg-subtle)' : 'transparent',
              }}
            >
              {status === 'all' ? 'All' : STATUS_OPTIONS.find((s) => s.value === status)!.label}
            </button>
          ))}
        </div>
      )}

      {/* Blocker list */}
      {loading ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
      ) : filteredBlockers.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {filterStatus === 'all' ? 'No blockers logged. 🎉' : `No ${filterStatus} blockers.`}
        </p>
      ) : (
        <div className="space-y-1">
          {filteredBlockers.map((blocker) => {
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === blocker.status)!;
            const isExpanded = expanded.has(blocker.id);

            return (
              <div key={blocker.id} className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => toggleExpand(blocker.id)}>
                  {isExpanded ? <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />}
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{blocker.title}</span>
                  <span className="badge" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {blocker.description && (
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{blocker.description}</p>
                    )}
                    {blocker.resolution && (
                      <p className="text-xs" style={{ color: 'var(--success)' }}>✅ Resolution: {blocker.resolution}</p>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      {STATUS_OPTIONS.filter((s) => s.value !== blocker.status).map((s) => (
                        <button
                          key={s.value}
                          onClick={(e) => { e.stopPropagation(); updateStatus(blocker.id, s.value); }}
                          className="text-xs px-2 py-0.5 rounded transition-soft"
                          style={{ color: s.color, background: s.bg }}
                        >
                          → {s.label}
                        </button>
                      ))}
                      <div className="flex-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(blocker.id); }}
                        className="text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
