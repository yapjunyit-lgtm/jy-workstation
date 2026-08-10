import { useLocation } from 'react-router-dom';
import { Search, Play, Pause, Cloud } from 'lucide-react';
import { useCloudStatusStore } from '../../stores/useCloudStatusStore';
import { ShiftIndicator } from '../dashboard/ShiftIndicator';
import { useTimerStore } from '../../stores/useTimerStore';
import { formatTimer } from '../../lib/utils';

const PAGE_TITLES: Record<string, [string, string]> = {
  '/':         ['Today', 'Daily command center'],
  '/kanban':   ['Kanban', 'Tasks across lifecycle'],
  '/vault':    ['Vault', 'Prompts, data, security'],
  '/ai':       ['AI Assistant', 'Codex on your data'],
  '/impact':   ['Impact', 'Career building tracker'],
  '/calendar': ['Calendar', 'Work & study balance'],
  '/settings': ['Settings', 'Preferences & sync'],
};

export function TopBar() {
  const location = useLocation();
  const [title, subtitle] = PAGE_TITLES[location.pathname] || ['JY Workstation', ''];
  const { mode, isRunning, remainingSeconds, start, pause } = useTimerStore();
  const bridgeConnected = useCloudStatusStore((s) => s.connected);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const toggleTimer = () => {
    if (mode === 'idle') {
      useTimerStore.getState().setMode('pomodoro');
      useTimerStore.getState().start();
    } else if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  return (
    <header
      className="flex items-center gap-4"
      style={{
        height: 56,
        flexShrink: 0,
        background: 'color-mix(in oklch, var(--bg-elevated) 70%, transparent)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
      }}
    >
      {/* Title — sans + mono eyebrow */}
      <div className="flex items-baseline gap-3 flex-shrink-0">
        <span className="text-[17px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {title}
        </span>
        <span className="meta-label hidden md:inline">{subtitle}</span>
      </div>

      <div className="flex-1" />

      {/* Shift + date */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className="meta-label hidden lg:inline">{dateStr}</span>
        <ShiftIndicator />
      </div>

      {/* Search hint — opens the command palette */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('jy:open-command-palette'))}
        className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs flex-shrink-0"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card-contact)',
          color: 'var(--text-muted)',
          minWidth: 200,
          cursor: 'pointer',
        }}
        aria-label="Open command palette"
      >
        <Search size={13} aria-hidden="true" />
        <span className="flex-1">Quick search…</span>
        <kbd
          className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-faint)' }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Cloud sync status */}
      <div
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs flex-shrink-0"
        title={bridgeConnected ? 'Local SQLite sync connected — vault bridge reachable' : 'Local sync off — start the bridge: npm run bridge'}
        style={{
          background: bridgeConnected ? 'oklch(94% 0.035 150)' : 'var(--bg-elevated)',
          border: '1px solid ' + (bridgeConnected ? 'var(--success)' : 'var(--border)'),
          color: bridgeConnected ? 'var(--success)' : 'var(--text-faint)',
        }}
      >
        <Cloud size={12} />
        <span className="hidden sm:inline">{bridgeConnected ? 'local db' : 'sync off'}</span>
      </div>

      {/* Mini timer */}
      <button
        onClick={toggleTimer}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs flex-shrink-0"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid ' + (isRunning ? 'var(--accent)' : 'var(--border)'),
          boxShadow: 'var(--shadow-card-contact)',
          color: isRunning ? 'var(--accent)' : 'var(--text-muted)',
        }}
        title="Toggle Pomodoro timer"
      >
        {isRunning ? <Pause size={11} /> : <Play size={11} />}
        <span>{formatTimer(remainingSeconds)}</span>
      </button>
    </header>
  );
}
