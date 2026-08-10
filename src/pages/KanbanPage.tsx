import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKanbanStore } from '../stores/useKanbanStore';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { CategoryFilter } from '../components/kanban/CategoryFilter';

export function KanbanPage() {
  const { hydrate, loading } = useKanbanStore();
  const [searchParams] = useSearchParams();
  const initialTaskId = searchParams.get('task');

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <div className="page-enter space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          📋 Kanban Board
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Drag tasks between columns
          </span>
        </div>
      </div>

      <CategoryFilter />

      {loading ? (
        <div className="card-static flex items-center justify-center h-40">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading board...</p>
        </div>
      ) : (
        <KanbanBoard initialTaskId={initialTaskId} />
      )}
    </div>
  );
}
