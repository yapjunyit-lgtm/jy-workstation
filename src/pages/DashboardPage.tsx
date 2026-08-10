import { PrioritiesDashboard } from '../components/dashboard/PrioritiesDashboard';
import { PomodoroTimer } from '../components/dashboard/PomodoroTimer';
import { BlockerTracker } from '../components/dashboard/BlockerTracker';
import { RichEditor } from '../components/scratchpad/RichEditor';
import { QuickNotesPanel } from '../components/dashboard/QuickNotesPanel';

export function DashboardPage() {
  const today = new Date();
  const dayNum = today.getDate();

  return (
    <div className="page-enter space-y-8">
      {/* Hero header — typography led */}
      <div className="t-reveal is-in">
        <span className="meta-label">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long' })}
        </span>
        <h2 className="mt-1 text-[42px] font-bold tracking-[-0.02em] leading-[1.02]" style={{ color: 'var(--text)' }}>
          Your <span className="serif-accent" style={{ color: 'var(--accent)' }}>day</span>, {dayNum}.
        </h2>
        <p className="mt-2 text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
          Priorities, tasks, and a scratchpad — one calm surface to run your shift.
        </p>
      </div>

      {/* Main grid: priorities + blockers (left) | pomodoro (right) */}
      <div className="t-stagger is-in grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)' }}>
        <div className="space-y-6">
          <PrioritiesDashboard />
          <BlockerTracker />
        </div>
        <div className="space-y-6">
          <PomodoroTimer />
          <QuickNotesPanel />
        </div>
      </div>

      {/* Scratchpad — full width */}
      <RichEditor />
    </div>
  );
}
