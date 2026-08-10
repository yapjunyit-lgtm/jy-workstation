import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { KANBAN_COLUMNS } from '../../lib/constants';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { KanbanCardDetail } from './KanbanCardDetail';
import type { KanbanTask, KanbanColumn as ColumnType } from '../../lib/types';

interface KanbanBoardProps {
  initialTaskId?: string | null;
}

export function KanbanBoard({ initialTaskId }: KanbanBoardProps = {}) {
  const { tasks, moveTask, add } = useKanbanStore();
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [_, setAddingToColumn] = useState<ColumnType | null>(null);

  // Auto-open a specific task (e.g. clicked from the calendar)
  useEffect(() => {
    if (!initialTaskId || tasks.length === 0) return;
    const task = tasks.find((t) => t.id === initialTaskId);
    if (task) setEditingTask(task);
  }, [initialTaskId, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // If dropped on a column
    const isColumn = KANBAN_COLUMNS.some((c) => c.id === overId);
    if (isColumn) {
      moveTask(taskId, overId as ColumnType);
      return;
    }

    // If dropped on another task, move to that task's column
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      moveTask(taskId, overTask.column);
    }
  };

  const handleQuickAdd = async (column: ColumnType) => {
    setAddingToColumn(column);
    const task = await add({ column, title: 'New Task' });
    setEditingTask(task);
    setAddingToColumn(null);
  };

  const getColumnTasks = (column: ColumnType) => {
    return tasks.filter((t) => t.column === column);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {KANBAN_COLUMNS.map(({ id, label }) => (
            <KanbanColumn
              key={id}
              column={id}
              label={label}
              tasks={getColumnTasks(id)}
              onCardClick={(task) => setEditingTask(task)}
              onAddTask={() => handleQuickAdd(id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{ opacity: 0.9, transform: 'rotate(3deg)' }}>
              <KanbanCard task={activeTask} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit modal */}
      {editingTask && (
        <KanbanCardDetail
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}
