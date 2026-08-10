import { useEffect, useState } from 'react';
import { useImpactStore } from '../stores/useImpactStore';
import { STARLogger } from '../components/impact/STARLogger';
import { STARCard } from '../components/impact/STARCard';
import { SOPTruacker } from '../components/impact/SOPTruacker';
import { SyncAgendaGenerator } from '../components/impact/SyncAgendaGenerator';
import type { STAREntry } from '../lib/types';
import { PageHeader } from '../components/layout/PageHeader';

export function ImpactPage() {
  const { starEntries, hydrate, loading, updateStar, removeStar } = useImpactStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<STAREntry>>({});

  useEffect(() => { hydrate(); }, []);

  const startEdit = (entry: STAREntry) => {
    setEditingId(entry.id);
    setEditForm(entry);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateStar(editingId, editForm);
    setEditingId(null);
  };

  return (
    <div className="page-enter space-y-8">
      <PageHeader eyebrow="Career" title="Impact " accent="Log" />

      {/* Section 1: 1:1 Agenda */}
      <div className="card-static">
        <SyncAgendaGenerator />
      </div>

      {/* Section 2: STAR Logger */}
      <div>
        <STARLogger />

        {/* Edit modal */}
        {editingId && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]" style={{ background: 'rgba(59, 56, 51, 0.15)' }} onClick={(e) => { if (e.target === e.currentTarget) setEditingId(null); }}>
            <div className="card-static w-full max-w-lg mx-4 shadow-lg modal-enter space-y-3" style={{ maxHeight: '80vh', overflow: 'auto' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Edit STAR Entry</h3>
              <input value={editForm.situation || ''} onChange={(e) => setEditForm({ ...editForm, situation: e.target.value })} placeholder="Situation" className="input-sakura text-sm" />
              <input value={editForm.task || ''} onChange={(e) => setEditForm({ ...editForm, task: e.target.value })} placeholder="Task" className="input-sakura text-sm" />
              <textarea value={editForm.action || ''} onChange={(e) => setEditForm({ ...editForm, action: e.target.value })} placeholder="Action" className="input-sakura text-sm" rows={3} />
              <input value={editForm.result || ''} onChange={(e) => setEditForm({ ...editForm, result: e.target.value })} placeholder="Result" className="input-sakura text-sm" />
              <input value={editForm.quantitativeMetrics || ''} onChange={(e) => setEditForm({ ...editForm, quantitativeMetrics: e.target.value })} placeholder="Quantified Metrics" className="input-sakura text-sm" />
              <div className="flex items-center gap-2">
                <button onClick={saveEdit} className="btn-sakura btn-primary btn-sm">Save</button>
                <button onClick={() => setEditingId(null)} className="btn-sakura btn-ghost btn-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm mt-3" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
        ) : starEntries.length === 0 ? (
          <p className="text-sm mt-3" style={{ color: 'var(--text-tertiary)' }}>No STAR entries yet. Log your first impact!</p>
        ) : (
          <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))' }}>
            {starEntries.map((entry) => (
              <STARCard
                key={entry.id}
                entry={entry}
                onEdit={() => startEdit(entry)}
                onDelete={() => removeStar(entry.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 3: SOP Tracker */}
      <div className="card-static">
        <SOPTruacker />
      </div>
    </div>
  );
}
