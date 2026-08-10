import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Lock, Unlock } from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { TASK_CATEGORIES, KANBAN_COLUMNS } from '../../lib/constants';
import type { KanbanTask, KanbanColumn, TaskCategory } from '../../lib/types';
import { shouldAutoFocus } from '../../lib/utils';

interface KanbanCardDetailProps {
  task: KanbanTask;
  onClose: () => void;
}

export function KanbanCardDetail({ task, onClose }: KanbanCardDetailProps) {
  const { update, remove, addSubtask, toggleSubtask } = useKanbanStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [priority, setPriority] = useState(task.priority);
  const [column, setColumn] = useState<KanbanColumn>(task.column);
  const [targetDate, setTargetDate] = useState(task.targetDate || '');
  const [securityPassed, setSecurityPassed] = useState(task.securityReviewPassed);
  const [newSubtask, setNewSubtask] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save on changes
  useEffect(() => {
    if (!hasChanges) return;
    const timer = setTimeout(() => {
      update(task.id, {
        title, description, category, priority, column,
        targetDate: targetDate || undefined,
        securityReviewPassed: securityPassed,
      });
      setHasChanges(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [title, description, category, priority, column, targetDate, securityPassed, hasChanges]);

  const markChanged = () => setHasChanges(true);

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      remove(task.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Edit task"
    >
      <button
        type="button"
        aria-label="Close task editor"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(59, 56, 51, 0.15)', cursor: 'default' }}
      />
      <div
        className="card-static w-full max-w-lg mx-4 shadow-lg modal-enter overflow-y-auto relative"
        style={{ maxHeight: '80vh', animation: 'scaleIn 260ms var(--ease-out-quint)', overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Edit Task</span>
          <div className="flex items-center gap-1">
            <button onClick={handleDelete} className="btn-sakura btn-ghost btn-sm" style={{ color: 'var(--danger)' }} aria-label="Delete task">
              <Trash2 size={14} aria-hidden="true" />
            </button>
            <button onClick={onClose} className="btn-sakura btn-ghost btn-sm" aria-label="Close task editor">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markChanged(); }}
            placeholder="Task title"
            className="input-sakura text-base font-medium"
            autoFocus={shouldAutoFocus()}
            aria-label="Task title"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); markChanged(); }}
            placeholder="Description (optional)"
            className="input-sakura text-sm"
            rows={3}
            aria-label="Description"
          />

          {/* Category + Priority + Column row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as TaskCategory); markChanged(); }}
                className="input-sakura text-sm"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Priority</label>
              <select
                value={priority}
                onChange={(e) => { setPriority(Number(e.target.value) as 1|2|3|4|5); markChanged(); }}
                className="input-sakura text-sm"
              >
                {[1,2,3,4,5].map((p) => (
                  <option key={p} value={p}>P{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Status</label>
              <select
                value={column}
                onChange={(e) => { setColumn(e.target.value as KanbanColumn); markChanged(); }}
                className="input-sakura text-sm"
              >
                {KANBAN_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Date + Security */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => { setTargetDate(e.target.value); markChanged(); }}
                className="input-sakura text-sm"
              />
            </div>
            <div className="flex items-end pb-1">
              <button
                onClick={() => { setSecurityPassed(!securityPassed); markChanged(); }}
                className="btn-sakura btn-sm flex items-center gap-1.5"
                aria-pressed={securityPassed}
                style={{
                  background: securityPassed ? '#E2EDE4' : 'var(--bg-subtle)',
                  color: securityPassed ? 'var(--success)' : 'var(--text-secondary)',
                }}
              >
                {securityPassed ? <Lock size={12} aria-hidden="true" /> : <Unlock size={12} aria-hidden="true" />}
                <span className="text-xs">{securityPassed ? 'Reviewed' : 'Security Check'}</span>
              </button>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="text-[10px] block mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Subtasks ({task.subtasks.filter((s) => s.done).length}/{task.subtasks.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {task.subtasks.map((st) => (
                <label key={st.id} className="flex items-center gap-2 py-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => toggleSubtask(task.id, st.id)}
                    className="flex-shrink-0 w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: 'var(--success)' }}
                  />
                  <span
                    className="text-sm flex-1"
                    style={{
                      color: st.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      textDecoration: st.done ? 'line-through' : 'none',
                    }}
                  >
                    {st.title}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                placeholder="Add subtask…"
                className="input-sakura text-sm flex-1"
                aria-label="New subtask title"
              />
              <button onClick={handleAddSubtask} className="btn-sakura btn-ghost btn-sm" disabled={!newSubtask.trim()} aria-label="Add subtask">
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Auto-saving</span>
          <button onClick={onClose} className="btn-sakura btn-primary btn-sm">Done</button>
        </div>
      </div>
    </div>
  );
}
