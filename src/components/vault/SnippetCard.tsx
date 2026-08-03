import { useState } from 'react';
import { Copy, Check, Star, Trash2 } from 'lucide-react';
import { copyToClipboard, truncate } from '../../lib/utils';
import type { Snippet } from '../../lib/types';
import { SNIPPET_CATEGORIES } from '../../lib/constants';

interface SnippetCardProps {
  snippet: Snippet;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export function SnippetCard({ snippet, onToggleFavorite, onDelete }: SnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const categoryLabel = SNIPPET_CATEGORIES.find((c) => c.id === snippet.category)?.label || snippet.category;

  const handleCopy = async () => {
    const success = await copyToClipboard(snippet.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card-static" style={{ padding: '16px' }}>
      <div className="space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {snippet.title}
            </h4>
            <span className="badge badge-neutral text-[10px] mt-1">{categoryLabel}</span>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={onToggleFavorite}
              className="btn-sakura btn-ghost btn-sm"
              title={snippet.isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star size={12} fill={snippet.isFavorite ? 'var(--warning)' : 'none'} color={snippet.isFavorite ? 'var(--warning)' : 'var(--text-tertiary)'} />
            </button>
            <button onClick={handleCopy} className="btn-sakura btn-ghost btn-sm" title="Copy to clipboard">
              {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            </button>
            <button onClick={onDelete} className="btn-sakura btn-ghost btn-sm" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Code preview */}
        <div
          className="rounded-lg p-3 cursor-pointer overflow-hidden transition-soft"
          style={{ background: 'var(--bg-subtle)', maxHeight: expanded ? 'none' : '80px' }}
          onClick={() => setExpanded(!expanded)}
        >
          <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {expanded ? snippet.content : truncate(snippet.content, 150)}
          </pre>
          {snippet.content.length > 150 && !expanded && (
            <p className="text-[10px] mt-1" style={{ color: 'var(--accent)' }}>Click to expand</p>
          )}
        </div>

        {/* Tags */}
        {snippet.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {snippet.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-root)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
