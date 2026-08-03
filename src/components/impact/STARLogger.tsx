import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useImpactStore } from '../../stores/useImpactStore';
import { todayISO } from '../../lib/utils';

export function STARLogger() {
  const { addStar } = useImpactStore();
  const [showForm, setShowForm] = useState(false);
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [metrics, setMetrics] = useState('');
  const [weekStart, setWeekStart] = useState(todayISO());

  const reset = () => {
    setSituation(''); setTask(''); setAction(''); setResult(''); setMetrics('');
    setWeekStart(todayISO()); setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!situation.trim() || !task.trim() || !action.trim()) return;
    await addStar({
      weekStart,
      situation: situation.trim(),
      task: task.trim(),
      action: action.trim(),
      result: result.trim(),
      quantitativeMetrics: metrics.trim(),
    });
    reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>STAR Entries</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-sakura btn-primary btn-sm">
          <Plus size={14} /> New Entry
        </button>
      </div>

      {showForm && (
        <div className="card-static space-y-3" style={{ background: 'var(--bg-subtle)', border: 'none' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Week Starting</label>
              <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="input-sakura text-sm" />
            </div>
          </div>

          <div>
            <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>S — Situation (Context)</label>
            <textarea value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="What was the context or challenge?" className="input-sakura text-sm" rows={2} />
          </div>

          <div>
            <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>T — Task (Your responsibility)</label>
            <textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder="What was your specific task or goal?" className="input-sakura text-sm" rows={2} />
          </div>

          <div>
            <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>A — Action (What you did)</label>
            <textarea value={action} onChange={(e) => setAction(e.target.value)} placeholder="What actions did you take? Be specific." className="input-sakura text-sm" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>R — Result (Outcome)</label>
              <textarea value={result} onChange={(e) => setResult(e.target.value)} placeholder="What was the outcome?" className="input-sakura text-sm" rows={2} />
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Quantified Metrics</label>
              <textarea value={metrics} onChange={(e) => setMetrics(e.target.value)} placeholder="E.g., Reduced processing time by 40%, saved 10 hours/week" className="input-sakura text-sm" rows={2} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleSubmit} className="btn-sakura btn-primary btn-sm">Save Entry</button>
            <button onClick={reset} className="btn-sakura btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
