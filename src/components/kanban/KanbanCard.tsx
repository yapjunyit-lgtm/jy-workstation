import { useDraggable } from '@dnd-kit/core';
import { Calendar, Lock, MoreHorizontal } from 'lucide-react';
import type { KanbanTask } from '../../lib/types';
import { TASK_CATEGORIES } from '../../lib/constants';
import { formatDate, truncate } from '../../lib/utils';

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

export function KanbanCard({ task, onClick }: KanbanCardProps) {
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

  const isOverdue = task.targetDate && new Date(task.targetDate) < new Date() && task.column !== 'completed';

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
