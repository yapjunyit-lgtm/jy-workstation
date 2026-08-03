import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { usePrioritiesStore } from '../../stores/usePrioritiesStore';
import { PriorityCard } from './PriorityCard';

export function DailyPriorities() {
  const { priorities, date, loading, hydrate, add, toggle, remove } = usePrioritiesStore();
  const [newTitle, setNewTitle] = useState('');
  const [addingForRank, setAddingForRank] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    hydrate(date);
  }, [date]);

  const handleAdd = useCallback(async (rank: 1 | 2 | 3) => {
    if (!newTitle.trim()) return;
    await add(newTitle.trim(), rank);
    setNewTitle('');
    setAddingForRank(null);
  }, [newTitle, add]);

  const handleKeyDown = (e: React.KeyboardEvent, rank: 1 | 2 | 3) => {
    if (e.key === 'Enter') handleAdd(rank);
    if (e.key === 'Escape') { setNewTitle(''); setAddingForRank(null); }
  };

  // Separate by rank
  const p1 = priorities.filter((p) => p.rank === 1);
  const p2 = priorities.filter((p) => p.rank === 2);
  const p3 = priorities.filter((p) => p.rank === 3);

  const rankSections = [
    { rank: 1 as const, label: 'P1 — Critical', color: 'var(--danger)', items: p1 },
    { rank: 2 as const, label: 'P2 — Important', color: 'var(--warning)', items: p2 },
    { rank: 3 as const, label: 'P3 — Nice to have', color: 'var(--info)', items: p3 },
  ];

  return (
    <div className="card-static space-y-3">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Today's Priorities
      </h3>

      {loading ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
      ) : (
        <div className="space-y-2">
          {rankSections.map(({ rank, label, color, items }) => (
            <div key={rank}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium" style={{ color }}>{label}</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  ({items.length})
                </span>
              </div>

              {items.length === 0 && addingForRank !== rank && (
                <button
                  onClick={() => setAddingForRank(rank)}
                  className="w-full py-2 px-3 rounded-lg border border-dashed transition-soft text-xs flex items-center justify-center gap-1"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}
                >
                  <Plus size={12} />
                  Add P{rank} priority
                </button>
              )}

              {items.map((p) => (
                <PriorityCard
                  key={p.id}
                  priority={p}
                  onToggle={() => toggle(p.id)}
                  onDelete={() => remove(p.id)}
                />
              ))}

              {addingForRank === rank && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rank)}
                    onBlur={() => {
                      if (newTitle.trim()) handleAdd(rank);
                      else setAddingForRank(null);
                    }}
                    placeholder={`Add P${rank} priority...`}
                    className="input-sakura text-sm flex-1"
                    autoFocus
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress summary */}
      {priorities.length > 0 && (
        <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {priorities.filter((p) => p.completed).length}/{priorities.length} completed
          </span>
          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
            <div
              className="h-full rounded-full transition-soft"
              style={{
                width: `${priorities.length > 0 ? (priorities.filter((p) => p.completed).length / priorities.length) * 100 : 0}%`,
                background: 'var(--success)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
