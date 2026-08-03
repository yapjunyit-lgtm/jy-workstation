import { useKanbanStore } from '../../stores/useKanbanStore';
import { TASK_CATEGORIES } from '../../lib/constants';
import type { TaskCategory } from '../../lib/types';

export function CategoryFilter() {
  const { filterCategories, setFilter } = useKanbanStore();

  const toggle = (categoryId: TaskCategory) => {
    if (filterCategories.includes(categoryId)) {
      setFilter(filterCategories.filter((c) => c !== categoryId));
    } else {
      setFilter([...filterCategories, categoryId]);
    }
  };

  const clearAll = () => setFilter([]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {filterCategories.length > 0 && (
        <button
          onClick={clearAll}
          className="text-xs px-2 py-0.5 rounded-full transition-soft"
          style={{ color: 'var(--danger)', background: '#F3E4E0' }}
        >
          Clear filters
        </button>
      )}
      {TASK_CATEGORIES.map((cat) => {
        const active = filterCategories.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => toggle(cat.id)}
            className="text-xs px-2.5 py-1 rounded-full transition-soft flex items-center gap-1"
            style={{
              color: active ? 'white' : cat.color,
              background: active ? cat.color : 'var(--bg-subtle)',
              border: active ? 'none' : `1px solid var(--border-color)`,
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
