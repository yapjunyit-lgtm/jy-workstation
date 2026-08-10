import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKanbanStore } from '../stores/useKanbanStore';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { CategoryFilter } from '../components/kanban/CategoryFilter';
import { PageHeader } from '../components/layout/PageHeader';
import { Skeleton } from '../components/layout/Skeleton';

export function KanbanPage() {
  const { hydrate, loading } = useKanbanStore();
  const [searchParams] = useSearchParams();
  const initialTaskId = searchParams.get('task');

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <div className="page-enter space-y-4">
      <PageHeader eyebrow="Board" title="Kanban " accent="Board">
        <span className="meta-label">Drag tasks between columns</span>
      </PageHeader>

      <CategoryFilter />

      {loading ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton height={20} width={120} />
              <Skeleton height={90} />
              <Skeleton height={90} width="92%" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard initialTaskId={initialTaskId} />
      )}
    </div>
  );
}
