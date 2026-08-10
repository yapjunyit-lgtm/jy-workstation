import { useDraggable } from '@dnd-kit/core';
import { Calendar, Check, Lock, MoreHorizontal } from 'lucide-react';
import type { KanbanTask } from '../../lib/types';
import { TASK_CATEGORIES } from '../../lib/constants';
import { formatDate, truncate } from '../../lib/utils';
import { useKanbanStore } from '../../stores/useKanbanStore';

interface KanbanCardProps {
  task: KanbanTask;
  onClick: () => void;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--danger)',
  2: 'var(--warning)',
  3: 'var(--info)',
  4: 'var(--accent)',
  5: 'var(--text-tertiary)',
};

const MAX_SUBTASKS_SHOWN = 6;

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const toggleSubtask = useKanbanStore((s) => s.toggleSubtask);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 10,
    opacity: isDragging ? 0.85 : 1,
  } : undefined;

  const category = TASK_CATEGORIES.find((c) => c.id === task.category);
  const completedSubtasks = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const hiddenSubtasks = totalSubtasks - MAX_SUBTASKS_SHOWN;

  const isOverdue = task.targetDate && new Date(task.targetDate) < new Date() && task.column !== 'completed';

  const handleToggle = (e: React.SyntheticEvent, subtaskId: string) => {
    // Prevent drag start + card open, just toggle the subtask
    e.stopPropagation();
    toggleSubtask(task.id, subtaskId);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="card cursor-grab active:cursor-grabbing transition-soft select-none"
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Category + Priority row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {category && (
            <span className="badge badge-neutral text-[10px]">
              {category.label}
            </span>
          )}
          <span
            className="badge text-[10px]"
            style={{
              background: PRIORITY_COLORS[task.priority] + '1A',
              color: PRIORITY_COLORS[task.priority],
            }}
          >
            P{task.priority}
          </span>
          {task.securityReviewPassed && (
            <Lock size={10} style={{ color: 'var(--success)' }} />
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
          {truncate(task.title, 80)}
        </h4>

        {/* Subtask list — inline checkboxes */}
        {totalSubtasks > 0 && (
          <div className="space-y-1" onPointerDown={(e) => e.stopPropagation()}>
            {task.subtasks.slice(0, MAX_SUBTASKS_SHOWN).map((st) => (
              <div
                key={st.id}
                className="flex items-center gap-2 py-0.5 px-1 rounded transition-soft"
                style={{ background: st.done ? 'var(--bg-subtle)' : 'transparent' }}
                onClick={(e) => handleToggle(e, st.id)}
              >
                <span
                  className="flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-soft"
                  style={{
                    borderColor: st.done ? 'var(--success)' : 'var(--border-color)',
                    background: st.done ? 'var(--success)' : 'transparent',
                  }}
                >
                  {st.done && <Check size={9} color="white" strokeWidth={3} />}
                </span>
                <span
                  className="text-xs flex-1 truncate"
                  style={{
                    color: st.done ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    textDecoration: st.done ? 'line-through' : 'none',
                  }}
                >
                  {st.title}
                </span>
              </div>
            ))}
            {hiddenSubtasks > 0 && (
              <p className="text-[10px] pl-1" style={{ color: 'var(--text-tertiary)' }}>
                +{hiddenSubtasks} more
              </p>
            )}
          </div>
        )}

        {/* Subtask progress */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              <div
                className="h-full rounded-full transition-soft"
                style={{
                  width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                  background: 'var(--success)',
                }}
              />
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}

        {/* Bottom row: date + overdue */}
        <div className="flex items-center gap-1.5 pt-1">
          {task.targetDate && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-tertiary)' }}
            >
              <Calendar size={10} />
              {formatDate(task.targetDate)}
              {isOverdue && ' • Overdue'}
            </span>
          )}
          <div className="flex-1" />
          <MoreHorizontal size={12} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    </div>
  );
}
