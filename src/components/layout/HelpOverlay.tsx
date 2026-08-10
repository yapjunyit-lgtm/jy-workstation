import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { keys: '⌘K', description: 'Open command palette' },
  { keys: '⌘1–6', description: 'Navigate to tabs' },
  { keys: 'n', description: 'New Kanban task' },
  { keys: 'b', description: 'Log a blocker' },
  { keys: '/', description: 'Focus search (Vault page)' },
  { keys: 'Esc', description: 'Close modal / palette' },
  { keys: '?', description: 'Show this help overlay' },
];

export function HelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <button
        type="button"
        aria-label="Close shortcuts"
        onClick={() => setIsOpen(false)}
        className="absolute inset-0"
        style={{ background: 'rgba(59, 56, 51, 0.15)', cursor: 'default' }}
      />
      <div
        className="card-static w-full max-w-sm mx-4 shadow-xl modal-enter relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>⌨ Keyboard Shortcuts</h3>
          <button onClick={() => setIsOpen(false)} className="btn-sakura btn-ghost btn-sm" aria-label="Close shortcuts">
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.description}</span>
              <kbd className="text-xs px-2 py-0.5 rounded font-mono" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-subtle)' }}>
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>

        <p className="text-[10px] mt-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
          Press ? to toggle this help overlay
        </p>
      </div>
    </div>
  );
}
