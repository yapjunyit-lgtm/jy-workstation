import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Check } from 'lucide-react';
import { usePrioritiesStore } from '../../stores/usePrioritiesStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { formatDate, todayISO } from '../../lib/utils';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--danger)',
  2: 'var(--warning)',
  3: 'var(--info)',
  4: 'var(--accent)',
  5: 'var(--text-tertiary)',
};

const RANK_LABEL: Record<number, string> = {
  1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4', 5: 'P5',
};

export function PrioritiesDashboard() {
  const navigate = useNavigate();
  const {
    priorities, loading: pLoading, hydrateAll, add: addPriority, toggle, remove,
  } = usePrioritiesStore();
  const { tasks, hydrate: hydrateKanban, add: addTask } = useKanbanStore();

  const [newPriority, setNewPriority] = useState('');
  const [priorityRank, setPriorityRank] = useState<1 | 2 | 3>(1);
  const [addingPriority, setAddingPriority] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    hydrateAll();
    hydrateKanban();
  }, []);

  const sortedTasks = tasks
    .filter((t) => t.column !== 'completed')
    .sort((a, b) => a.priority - b.priority || (a.targetDate || '').localeCompare(b.targetDate || ''));
  const today = todayISO();

  const handleAddPriority = () => {
    if (!newPriority.trim()) return;
    addPriority(newPriority.trim(), priorityRank);
    setNewPriority('');
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    addTask({ title: newTask.trim(), column: 'backlog', targetDate: newTaskDue || undefined });
    setNewTask('');
    setNewTaskDue('');
  };

  return (
    <div className="card-static space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Priorities
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {priorities.length} manual · {tasks.length} kanban
        </span>
      </div>

      {/* ── Manual priorities (all days) ── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            All Priorities
          </span>
          <button
            onClick={() => setAddingPriority(!addingPriority)}
            className="btn-sakura btn-ghost btn-sm"
            data-add-blocker
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {addingPriority && (
          <div className="flex items-center gap-2 mb-2">
            <select
              value={priorityRank}
              onChange={(e) => setPriorityRank(Number(e.target.value) as 1 | 2 | 3)}
              className="input-sakura text-xs"
              style={{ width: 64 }}
            >
              {[1, 2, 3].map((r) => <option key={r} value={r}>P{r}</option>)}
            </select>
            <input
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddPriority(); if (e.key === 'Escape') setAddingPriority(false); }}
              placeholder="Add a priority…"
              className="input-sakura text-sm flex-1"
              autoFocus
            />
            <button onClick={handleAddPriority} className="btn-sakura btn-primary btn-sm">Add</button>
          </div>
        )}

        {pLoading ? (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
        ) : priorities.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No priorities yet — add one above.</p>
        ) : (
          <div className="space-y-0.5">
            {priorities.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-soft"
                style={{ background: 'var(--bg-subtle)', opacity: p.completed ? 0.55 : 1 }}
              >
                <button
                  onClick={() => toggle(p.id)}
                  className="flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-soft"
                  style={{
                    borderColor: p.completed ? 'var(--success)' : 'var(--border-color)',
                    background: p.completed ? 'var(--success)' : 'transparent',
                  }}
                >
                  {p.completed && <Check size={10} color="white" strokeWidth={3} />}
                </button>
                <span
                  className="badge text-[10px] flex-shrink-0"
                  style={{ background: PRIORITY_COLORS[p.rank] + '1A', color: PRIORITY_COLORS[p.rank] }}
                >
                  {RANK_LABEL[p.rank]}
                </span>
                <span
                  className="text-sm flex-1 truncate"
                  style={{
                    color: 'var(--text-primary)',
                    textDecoration: p.completed ? 'line-through' : 'none',
                  }}
                >
                  {p.title}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                  {formatDate(p.date)}
                </span>
                <button
                  onClick={() => remove(p.id)}
                  className="text-xs flex-shrink-0"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Kanban tasks by priority ── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Kanban Tasks
          </span>
          <button
            onClick={() => setAddingTask(!addingTask)}
            className="btn-sakura btn-ghost btn-sm"
          >
            <Plus size={13} /> Add Task
          </button>
        </div>

        {addingTask && (
          <div className="flex items-center gap-2 mb-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') setAddingTask(false); }}
              placeholder="Task name…"
              className="input-sakura text-sm flex-1"
              autoFocus
            />
            <input
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
              className="input-sakura text-sm"
              style={{ width: 140 }}
            />
            <button onClick={handleAddTask} className="btn-sakura btn-primary btn-sm">Add</button>
          </div>
        )}

        {sortedTasks.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No kanban tasks yet.</p>
        ) : (
          <div className="space-y-0.5">
            {sortedTasks.map((t) => {
              const overdue = t.targetDate && t.targetDate < today && t.column !== 'completed';
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-soft"
                  style={{ background: 'var(--bg-subtle)' }}
                  onClick={() => navigate(`/kanban?task=${encodeURIComponent(t.id)}`)}
                  title="Open in Kanban"
                >
                  <span
                    className="badge text-[10px] flex-shrink-0"
                    style={{ background: PRIORITY_COLORS[t.priority] + '1A', color: PRIORITY_COLORS[t.priority] }}
                  >
                    {RANK_LABEL[t.priority]}
                  </span>
                  <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                    {t.title}
                  </span>
                  {t.targetDate ? (
                    <span
                      className="flex items-center gap-1 text-[10px] flex-shrink-0"
                      style={{ color: overdue ? 'var(--danger)' : 'var(--text-tertiary)' }}
                    >
                      <Calendar size={10} />
                      {formatDate(t.targetDate)}
                      {overdue && ' • overdue'}
                    </span>
                  ) : (
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      no due date
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
