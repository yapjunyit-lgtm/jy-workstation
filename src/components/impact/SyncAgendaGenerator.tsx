import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useBlockerStore } from '../../stores/useBlockerStore';

export function SyncAgendaGenerator() {
  const kanbanTasks = useKanbanStore((s) => s.tasks);
  const blockers = useBlockerStore((s) => s.blockers);

  const agenda = useMemo(() => {
    const completedThisWeek = kanbanTasks.filter(
      (t) => t.column === 'completed'
    );
    const inProgress = kanbanTasks.filter(
      (t) => t.column === 'in-progress' || t.column === 'testing'
    );
    const openBlockers = blockers.filter((b) => b.status !== 'resolved');

    return { completedThisWeek, inProgress, openBlockers };
  }, [kanbanTasks, blockers]);

  const handleCopy = () => {
    const items: string[] = [];

    if (agenda.completedThisWeek.length > 0) {
      items.push('## Completed');
      agenda.completedThisWeek.forEach((t) => items.push(`- [${t.category}] ${t.title}`));
      items.push('');
    }

    if (agenda.inProgress.length > 0) {
      items.push('## In Progress');
      agenda.inProgress.forEach((t) => items.push(`- [${t.category}] ${t.title}`));
      items.push('');
    }

    if (agenda.openBlockers.length > 0) {
      items.push('## Blockers');
      agenda.openBlockers.forEach((b) => items.push(`- [${b.status}] ${b.title}`));
      items.push('');
    }

    const text = items.join('\n');
    navigator.clipboard.writeText(text);
    alert('Agenda copied to clipboard!');
  };

  const total = agenda.completedThisWeek.length + agenda.inProgress.length + agenda.openBlockers.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          1:1 Sync Agenda
        </h3>
        <button onClick={handleCopy} className="btn-sakura btn-secondary btn-sm" disabled={total === 0}>
          <FileText size={12} /> Copy Agenda
        </button>
      </div>

      {total === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          No tasks or blockers yet. Add tasks on the Kanban board.
        </p>
      ) : (
        <div className="space-y-3">
          {agenda.completedThisWeek.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--success)' }}>
                Completed ({agenda.completedThisWeek.length})
              </h4>
              <ul className="space-y-0.5">
                {agenda.completedThisWeek.map((t) => (
                  <li key={t.id} className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="badge badge-neutral text-[10px]">{t.category}</span>
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {agenda.inProgress.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--info)' }}>
                In Progress ({agenda.inProgress.length})
              </h4>
              <ul className="space-y-0.5">
                {agenda.inProgress.map((t) => (
                  <li key={t.id} className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="badge badge-neutral text-[10px]">{t.category}</span>
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {agenda.openBlockers.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--danger)' }}>
                Blockers ({agenda.openBlockers.length})
              </h4>
              <ul className="space-y-0.5">
                {agenda.openBlockers.map((b) => (
                  <li key={b.id} className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="badge badge-danger text-[10px]">{b.status}</span>
                    {b.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
