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
  '/impact':   ['Impact', 'Career building tracker'],
  '/calendar': ['Calendar', 'Work & study balance'],
  '/settings': ['Settings', 'Preferences & backup'],
};

export function TopBar() {
  const location = useLocation();
  const [title, subtitle] = PAGE_TITLES[location.pathname] || ['JY Workstation', ''];
  const { mode, isRunning, remainingSeconds, start, pause } = useTimerStore();
  const cloudEmail = useCloudStatusStore((s) => s.email);

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
      className="app-topbar flex items-center border-b gap-4"
      style={{
        height: 52,
        background: 'var(--bg-root)',
        borderColor: 'var(--border-color)',
        padding: '0 24px',
      }}
    >
      {/* Title */}
      <div className="flex items-baseline gap-2 flex-shrink-0">
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
      </div>

      <div className="flex-1" />

      {/* Shift + date */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{dateStr}</span>
        <ShiftIndicator />
      </div>

      {/* Search hint */}
      <div
        className="topbar-search flex items-center gap-2 rounded px-2.5 py-1.5 border text-xs flex-shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-muted)',
          minWidth: 200,
        }}
      >
        <Search size={13} />
        <span className="flex-1">Quick search...</span>
        <kbd
          className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
          style={{
            background: 'var(--bg-subtle)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-tertiary)',
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Cloud sync status */}
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs flex-shrink-0 transition-soft"
        title={cloudEmail ? `Cloud sync on — ${cloudEmail}` : 'Cloud sync off — sign in at Settings → Cloud Sync'}
        style={{
          background: cloudEmail ? '#E2EDE4' : 'var(--bg-surface)',
          borderColor: cloudEmail ? 'var(--success)' : 'var(--border-color)',
          color: cloudEmail ? 'var(--success)' : 'var(--text-tertiary)',
        }}
      >
        <Cloud size={12} />
        <span className="max-w-[140px] truncate">{cloudEmail ? cloudEmail : 'sync off'}</span>
      </div>

      {/* Mini timer */}
      <button
        onClick={toggleTimer}
        className="topbar-mini-timer flex items-center gap-1.5 rounded px-2.5 py-1.5 border font-mono text-xs flex-shrink-0 transition-soft"
        style={{
          background: 'var(--bg-surface)',
          borderColor: isRunning ? 'var(--accent)' : 'var(--border-color)',
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
