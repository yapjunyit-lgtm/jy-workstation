import { Trash2, Edit3, Download } from 'lucide-react';
import type { STAREntry } from '../../lib/types';
import { generateSTARSummary, formatDate } from '../../lib/utils';
import { ObsidianExport } from '../../lib/obsidian-export';

interface STARCardProps {
  entry: STAREntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function STARCard({ entry, onEdit, onDelete }: STARCardProps) {
  const summary = generateSTARSummary(entry);

  const handleObsidianExport = () => {
    const note = ObsidianExport.starToExportNote(entry);
    ObsidianExport.downloadNote(note);
  };

  return (
    <div className="card-static space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Week of {formatDate(entry.weekStart)}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={handleObsidianExport} className="btn-sakura btn-ghost btn-sm" title="Export to Obsidian">
            <Download size={12} />
          </button>
          <button onClick={onEdit} className="btn-sakura btn-ghost btn-sm">
            <Edit3 size={12} />
          </button>
          <button onClick={onDelete} className="btn-sakura btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* STAR fields */}
      <div className="space-y-2">
        <div>
          <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--info)' }}>Situation</span>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{entry.situation}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--warning)' }}>Task</span>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{entry.task}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--accent)' }}>Action</span>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{entry.action}</p>
        </div>
        <div>
          <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--success)' }}>Result</span>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{entry.result}</p>
          {entry.quantitativeMetrics && (
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--success)' }}>
              📊 {entry.quantitativeMetrics}
            </p>
          )}
        </div>
      </div>

      {/* Auto-generated resume bullet */}
      <div className="rounded-lg p-3" style={{ background: 'var(--accent-soft)' }}>
        <span className="text-[10px] font-medium uppercase block mb-1" style={{ color: 'var(--accent)' }}>
          📝 Resume Bullet
        </span>
        <p className="text-sm" style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>
          {summary}
        </p>
      </div>
    </div>
  );
}
