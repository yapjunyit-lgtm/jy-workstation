import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { KanbanTask, KanbanColumn as ColumnType } from '../../lib/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: ColumnType;
  label: string;
  tasks: KanbanTask[];
  onCardClick: (task: KanbanTask) => void;
  onAddTask: () => void;
}

export function KanbanColumn({ column, label, tasks, onCardClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  });

  return (
    <div
      className="flex flex-col rounded-xl min-w-[280px] max-w-[320px] flex-1"
      style={{
        background: isOver ? 'var(--accent-soft)' : 'var(--bg-subtle)',
        transition: 'background 200ms ease-out',
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {label}
          </h3>
          <span className="badge badge-neutral text-[10px]">{tasks.length}</span>
        </div>
        <button
          onClick={onAddTask}
          className="btn-sakura btn-ghost btn-sm"
          title="Add task"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto min-h-[100px]"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 && (
            <div
              className="flex items-center justify-center h-20 rounded-lg border border-dashed transition-soft"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Drop tasks here
              </p>
            </div>
          )}
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
