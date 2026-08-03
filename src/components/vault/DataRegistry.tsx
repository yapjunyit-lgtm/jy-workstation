import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Database, Globe, BarChart3, File } from 'lucide-react';
import { useVaultStore } from '../../stores/useVaultStore';
import type { DataSource, DataSourceType } from '../../lib/types';

const TYPE_ICONS: Record<DataSourceType, typeof Database> = {
  'sql-table': Database,
  'api': Globe,
  'powerbi': BarChart3,
  'file': File,
};

const TYPE_LABELS: Record<DataSourceType, string> = {
  'sql-table': 'SQL Table',
  'api': 'API Endpoint',
  'powerbi': 'PowerBI',
  'file': 'File',
};

export function DataRegistry() {
  const { dataSources, addDataSource, updateDataSource, removeDataSource } = useVaultStore();
  const [showForm, setShowForm] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<DataSourceType>('sql-table');
  const [schema, setSchema] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName(''); setType('sql-table'); setSchema(''); setEndpoint(''); setNotes('');
    setShowForm(false); setEditId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editId) {
      await updateDataSource(editId, { name: name.trim(), type, schema, endpoint, notes: notes.trim() });
    } else {
      await addDataSource({ name: name.trim(), type, schema, endpoint, notes: notes.trim() });
    }
    resetForm();
  };

  const startEdit = (ds: DataSource) => {
    setName(ds.name); setType(ds.type); setSchema(ds.schema || ''); setEndpoint(ds.endpoint || ''); setNotes(ds.notes);
    setEditId(ds.id); setShowForm(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Data Sources</h3>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-sakura btn-primary btn-sm">
          <Plus size={14} /> Add
        </button>
      </div>

      {showForm && (
        <div className="card-static space-y-3" style={{ background: 'var(--bg-subtle)', border: 'none' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Source name" className="input-sakura text-sm" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value as DataSourceType)} className="input-sakura text-sm">
              {Object.entries(TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
            <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="Endpoint / path" className="input-sakura text-sm" />
          </div>
          <textarea value={schema} onChange={(e) => setSchema(e.target.value)} placeholder="Schema (JSON or text)" className="input-sakura text-sm font-mono" rows={3} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="input-sakura text-sm" rows={2} />
          <div className="flex items-center gap-2">
            <button onClick={handleSubmit} className="btn-sakura btn-primary btn-sm">{editId ? 'Update' : 'Save'}</button>
            <button onClick={resetForm} className="btn-sakura btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {dataSources.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No data sources registered yet.</p>
      ) : (
        <div className="space-y-2">
          {dataSources.map((ds) => {
            const Icon = TYPE_ICONS[ds.type];
            const isExpanded = expandedIds.has(ds.id);
            return (
              <div key={ds.id} className="card-static" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleExpand(ds.id)}>
                  {isExpanded ? <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />}
                  <Icon size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{ds.name}</span>
                  <span className="badge badge-neutral text-[10px]">{TYPE_LABELS[ds.type]}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(ds); }} className="btn-sakura btn-ghost btn-sm text-xs">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); removeDataSource(ds.id); }} className="btn-sakura btn-ghost btn-sm">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                    {ds.endpoint && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📍 {ds.endpoint}</p>}
                    {ds.schema && (
                      <pre className="text-xs font-mono p-2 rounded" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', maxHeight: 200, overflow: 'auto' }}>
                        {ds.schema}
                      </pre>
                    )}
                    {ds.notes && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{ds.notes}</p>}
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
