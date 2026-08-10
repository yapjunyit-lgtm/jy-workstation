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
      role="dialog"
      aria-modal="true"
      aria-label="Edit event"
    >
      <button
        type="button"
        aria-label="Close edit event"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(59, 56, 51, 0.15)', cursor: 'default' }}
      />
      <div className="card-static w-full max-w-sm mx-4 shadow-xl modal-enter space-y-3 relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Edit Event</h3>
          <div className="flex items-center gap-1">
            <button onClick={handleDelete} className="btn-sakura btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Delete" aria-label="Delete event">
              <Trash2 size={14} aria-hidden="true" />
            </button>
            <button onClick={onClose} className="btn-sakura btn-ghost btn-sm" aria-label="Close edit event">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Event title" className="input-sakura text-sm" aria-label="Event title" />

        <div className="flex items-center gap-3">
          <input type="number" value={startH} onChange={(e) => setStartH(e.target.value)} placeholder="Start" className="input-sakura text-sm flex-1" step="0.5" min="0" max="24" aria-label="Start hour" />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>to</span>
          <input type="number" value={endH} onChange={(e) => setEndH(e.target.value)} placeholder="End" className="input-sakura text-sm flex-1" step="0.5" min="0" max="24" aria-label="End hour" />
        </div>

        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{block.date} · {block.type}</p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={onClose} className="btn-sakura btn-ghost btn-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
