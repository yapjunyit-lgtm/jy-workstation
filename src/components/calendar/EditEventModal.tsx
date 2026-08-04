import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useCalendarStore } from '../../stores/useCalendarStore';
import type { TimeBlock as TimeBlockType } from '../../lib/types';

interface EditEventModalProps {
  block: TimeBlockType;
  onClose: () => void;
}

export function EditEventModal({ block, onClose }: EditEventModalProps) {
  const [label, setLabel] = useState(block.label);
  const [startH, setStartH] = useState(String(block.startHour));
  const [endH, setEndH] = useState(String(block.endHour));
  const removeBlock = useCalendarStore((s) => s.removeBlock);

  const handleDelete = () => {
    removeBlock(block.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(59, 56, 51, 0.15)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-static w-full max-w-sm mx-4 shadow-xl animate-scaleIn space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Edit Event</h3>
          <div className="flex items-center gap-1">
            <button onClick={handleDelete} className="btn-sakura btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Delete">
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="btn-sakura btn-ghost btn-sm"><X size={14} /></button>
          </div>
        </div>

        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Event title" className="input-sakura text-sm" />

        <div className="flex items-center gap-3">
          <input type="number" value={startH} onChange={(e) => setStartH(e.target.value)} placeholder="Start" className="input-sakura text-sm flex-1" step="0.5" min="0" max="24" />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>to</span>
          <input type="number" value={endH} onChange={(e) => setEndH(e.target.value)} placeholder="End" className="input-sakura text-sm flex-1" step="0.5" min="0" max="24" />
        </div>

        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{block.date} · {block.type}</p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={onClose} className="btn-sakura btn-ghost btn-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
