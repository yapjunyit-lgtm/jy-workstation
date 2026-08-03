import { GripVertical, Trash2 } from 'lucide-react';
import type { Priority } from '../../lib/types';

interface PriorityCardProps {
  priority: Priority;
  onToggle: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function PriorityCard({ priority, onToggle, onDelete, dragHandleProps }: PriorityCardProps) {
  const rankColors: Record<number, string> = {
    1: 'var(--danger)',
    2: 'var(--warning)',
    3: 'var(--info)',
  };

  return (
    <div
      className="flex items-center gap-3 py-2 px-1 group transition-soft"
      style={{
        opacity: priority.completed ? 0.5 : 1,
      }}
    >
      {/* Drag handle */}
      <button
        className="cursor-grab opacity-0 group-hover:opacity-100 transition-soft"
        style={{ color: 'var(--text-tertiary)' }}
        {...(dragHandleProps || {})}
      >
        <GripVertical size={14} />
      </button>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-soft"
        style={{
          borderColor: priority.completed ? 'var(--success)' : 'var(--border-color)',
          background: priority.completed ? 'var(--success)' : 'transparent',
        }}
      >
        {priority.completed && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Rank badge */}
      <span
        className="badge flex-shrink-0"
        style={{ background: rankColors[priority.rank] + '1A', color: rankColors[priority.rank] }}
      >
        P{priority.rank}
      </span>

      {/* Title */}
      <span
        className="flex-1 text-sm transition-soft"
        style={{
          color: priority.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: priority.completed ? 'line-through' : 'none',
        }}
      >
        {priority.title}
      </span>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-soft btn-sakura btn-ghost btn-sm"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
