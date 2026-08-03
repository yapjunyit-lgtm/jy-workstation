import { ShiftIndicator } from '../dashboard/ShiftIndicator';

export function StatusBar() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header
      className="flex items-center justify-between px-5 border-b"
      style={{ height: 48, background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {dateStr}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>·</span>
        <ShiftIndicator />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          ⌘K Search
        </span>
      </div>
    </header>
  );
}
