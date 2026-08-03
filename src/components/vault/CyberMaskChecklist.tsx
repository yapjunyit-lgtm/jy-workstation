import { useMemo } from 'react';
import { Shield, RotateCcw } from 'lucide-react';
import { useVaultStore } from '../../stores/useVaultStore';

export function CyberMaskChecklist() {
  const { checklist, toggleChecklistItem, resetChecklist } = useVaultStore();

  const categories = useMemo(() => {
    const map = new Map<string, typeof checklist>();
    checklist.forEach((item) => {
      const arr = map.get(item.category) || [];
      arr.push(item);
      map.set(item.category, arr);
    });
    return Array.from(map.entries());
  }, [checklist]);

  const totalChecked = checklist.filter((c) => c.checked).length;
  const progress = checklist.length > 0 ? (totalChecked / checklist.length) * 100 : 0;

  const handleReset = () => {
    if (confirm('Reset all checklist items?')) {
      resetChecklist();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color: 'var(--info)' }} />
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Cybersecurity Masking Checklist
          </h3>
        </div>
        <button onClick={handleReset} className="btn-sakura btn-ghost btn-sm">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {totalChecked}/{checklist.length} completed
          </span>
          <span className="text-xs" style={{ color: 'var(--accent)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
          <div
            className="h-full rounded-full transition-soft"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map(([category, items]) => (
          <div key={category}>
            <h4 className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {category}
            </h4>
            <div className="space-y-0.5">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-soft hover:bg-[var(--bg-subtle)]"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="rounded accent-[var(--accent)]"
                    style={{ width: 14, height: 14, cursor: 'pointer' }}
                  />
                  <span
                    className="text-sm flex-1"
                    style={{
                      color: item.checked ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      textDecoration: item.checked ? 'line-through' : 'none',
                    }}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
