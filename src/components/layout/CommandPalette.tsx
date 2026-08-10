import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useVaultStore } from '../../stores/useVaultStore';
import { useBlockerStore } from '../../stores/useBlockerStore';
import { useImpactStore } from '../../stores/useImpactStore';
import { shouldAutoFocus } from '../../lib/utils';

interface SearchResult {
  id: string;
  type: 'task' | 'snippet' | 'priority' | 'blocker' | 'star' | 'action' | 'nav';
  title: string;
  subtitle?: string;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const kanbanTasks = useKanbanStore((s) => s.tasks);
  const snippets = useVaultStore((s) => s.snippets);
  const blockers = useBlockerStore((s) => s.blockers);
  const starEntries = useImpactStore((s) => s.starEntries);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  useEffect(() => {
    const open = () => {
      setIsOpen(true);
      setQuery('');
      setSelectedIndex(0);
    };
    window.addEventListener('jy:open-command-palette', open);
    return () => window.removeEventListener('jy:open-command-palette', open);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (!query) {
      const nav: SearchResult[] = [
        { id: 'nav-dash', type: 'nav', title: 'Go to Dashboard', subtitle: '⌘1', action: () => navigate('/') },
        { id: 'nav-kanban', type: 'nav', title: 'Go to Kanban', subtitle: '⌘2', action: () => navigate('/kanban') },
        { id: 'nav-vault', type: 'nav', title: 'Go to Vault', subtitle: '⌘3', action: () => navigate('/vault') },
        { id: 'nav-impact', type: 'nav', title: 'Go to Impact', subtitle: '⌘4', action: () => navigate('/impact') },
        { id: 'nav-cal', type: 'nav', title: 'Go to Calendar', subtitle: '⌘5', action: () => navigate('/calendar') },
        { id: 'nav-set', type: 'nav', title: 'Go to Settings', subtitle: '⌘6', action: () => navigate('/settings') },
        { id: 'act-task', type: 'action', title: 'New Kanban Task', action: () => { navigate('/kanban'); useKanbanStore.getState().add({ column: 'backlog', title: 'New Task' }); } },
        { id: 'act-star', type: 'action', title: 'New STAR Entry', action: () => { navigate('/impact'); } },
        { id: 'act-block', type: 'action', title: 'Log Blocker', subtitle: 'b', action: () => { navigate('/'); setTimeout(() => (document.querySelector('[data-add-blocker]') as HTMLElement)?.click(), 100); } },
      ];
      return nav;
    }

    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    kanbanTasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q)) {
        items.push({ id: t.id, type: 'task', title: t.title, subtitle: t.column, action: () => { navigate('/kanban'); } });
      }
    });

    snippets.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))) {
        items.push({ id: s.id, type: 'snippet', title: s.title, subtitle: s.category, action: () => { navigate('/vault'); } });
      }
    });

    blockers.forEach((b) => {
      if (b.title.toLowerCase().includes(q)) {
        items.push({ id: b.id, type: 'blocker', title: b.title, subtitle: b.status, action: () => { navigate('/'); } });
      }
    });

    starEntries.forEach((e) => {
      if (e.situation.toLowerCase().includes(q) || e.task.toLowerCase().includes(q)) {
        items.push({ id: e.id, type: 'star', title: e.task || e.situation.slice(0, 60), subtitle: e.weekStart, action: () => { navigate('/impact'); } });
      }
    });

    return items.slice(0, 15);
  }, [query, kanbanTasks, snippets, blockers, starEntries, navigate]);

  const handleSelect = useCallback((result: SearchResult) => {
    result.action();
    setIsOpen(false);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  const typeColors: Record<string, string> = {
    task: 'var(--info)',
    snippet: 'var(--accent)',
    priority: 'var(--warning)',
    blocker: 'var(--danger)',
    star: 'var(--success)',
    action: 'var(--warning)',
    nav: 'var(--text-tertiary)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={() => setIsOpen(false)}
        className="absolute inset-0"
        style={{ background: 'rgba(59, 56, 51, 0.15)', cursor: 'default' }}
      />
      <div
        className="card-static w-full max-w-lg mx-4 shadow-xl modal-enter relative"
        style={{ padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, snippets, or navigate…"
            className="flex-1 text-sm bg-transparent border-none"
            style={{ color: 'var(--text-primary)' }}
            autoFocus={shouldAutoFocus()}
            aria-label="Search tasks and snippets"
          />
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-subtle)' }}>esc</span>
        </div>

        <div className="max-h-72 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          {results.length === 0 && query && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No results for "{query}"</p>
          )}
          {results.map((result, i) => (
            <button
              key={result.id}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-soft"
              style={{
                background: i === selectedIndex ? 'var(--bg-subtle)' : 'transparent',
              }}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded flex-shrink-0 w-12 text-center" style={{ color: typeColors[result.type], background: typeColors[result.type] + '1A' }}>
                {result.type}
              </span>
              <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{result.title}</span>
              {result.subtitle && (
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{result.subtitle}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
