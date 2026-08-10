import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { useVaultStore } from '../../stores/useVaultStore';
import { SNIPPET_CATEGORIES } from '../../lib/constants';
import { SnippetCard } from './SnippetCard';
import type { SnippetCategory } from '../../lib/types';
import { shouldAutoFocus } from '../../lib/utils';

export function SnippetLibrary() {
  const { snippets, addSnippet, updateSnippet, removeSnippet } = useVaultStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<SnippetCategory | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<SnippetCategory>('python-wrangling');
  const [newTags, setNewTags] = useState('');

  const filtered = useMemo(() => {
    return snippets.filter((s) => {
      const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
      const matchesSearch = !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [snippets, search, filterCategory]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await addSnippet({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            id="snippet-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets…"
            className="input-sakura text-sm pl-9"
            aria-label="Search snippets"
          />
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-sakura btn-primary btn-sm">
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card-static space-y-3" style={{ background: 'var(--bg-subtle)', border: 'none' }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Snippet title"
            className="input-sakura text-sm"
            autoFocus={shouldAutoFocus()}
            aria-label="Snippet title"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Paste code or prompt here…"
            className="input-sakura text-sm font-mono"
            rows={6}
            aria-label="Snippet content"
          />
          <div className="flex items-center gap-3">
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as SnippetCategory)} className="input-sakura text-sm w-auto">
              {SNIPPET_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="input-sakura text-sm flex-1"
              aria-label="Snippet tags"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} className="btn-sakura btn-primary btn-sm">Save</button>
            <button onClick={() => setShowAddForm(false)} className="btn-sakura btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className="text-xs px-2.5 py-1 rounded-full transition-soft"
          style={{
            color: filterCategory === 'all' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            background: filterCategory === 'all' ? 'var(--bg-subtle)' : 'transparent',
          }}
        >
          All
        </button>
        {SNIPPET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className="text-xs px-2.5 py-1 rounded-full transition-soft"
            style={{
              color: filterCategory === cat.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              background: filterCategory === cat.id ? 'var(--bg-subtle)' : 'transparent',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {filtered.length} snippet{filtered.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>

      {/* Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {filtered.map((s) => (
          <SnippetCard
            key={s.id}
            snippet={s}
            onToggleFavorite={() => updateSnippet(s.id, { isFavorite: !s.isFavorite })}
            onDelete={() => removeSnippet(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
