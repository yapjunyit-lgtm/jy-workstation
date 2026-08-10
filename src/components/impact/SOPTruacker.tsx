import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useImpactStore } from '../../stores/useImpactStore';
import { SOP_STATUSES } from '../../lib/constants';
import type { SOPStatus } from '../../lib/types';
import { shouldAutoFocus } from '../../lib/utils';

export function SOPTruacker() {
  const { sopDocuments, addSOP, updateSOPStatus, removeSOP } = useImpactStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addSOP(title.trim());
    setTitle('');
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>SOP & User Guide Tracker</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-sakura btn-primary btn-sm">
          <Plus size={14} /> Add SOP
        </button>
      </div>

      {showForm && (
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="SOP title…"
            className="input-sakura text-sm flex-1"
            autoFocus={shouldAutoFocus()}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }}
            aria-label="SOP title"
          />
          <button onClick={handleAdd} className="btn-sakura btn-primary btn-sm">Save</button>
          <button onClick={() => setShowForm(false)} className="btn-sakura btn-ghost btn-sm">Cancel</button>
        </div>
      )}

      {sopDocuments.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No SOPs tracked yet.</p>
      ) : (
        <div className="space-y-1">
          {sopDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
              <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{doc.title}</span>
              <select
                value={doc.status}
                onChange={(e) => updateSOPStatus(doc.id, e.target.value as SOPStatus)}
                className="text-xs rounded px-2 py-0.5 border"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}
              >
                {SOP_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button onClick={() => removeSOP(doc.id)} className="btn-sakura btn-ghost btn-sm" aria-label={`Delete ${doc.title}`}>
                <Trash2 size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
