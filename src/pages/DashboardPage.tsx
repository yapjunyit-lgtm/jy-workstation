import { DailyPriorities } from '../components/dashboard/DailyPriorities';
import { PomodoroTimer } from '../components/dashboard/PomodoroTimer';
import { BlockerTracker } from '../components/dashboard/BlockerTracker';
import { RichEditor } from '../components/scratchpad/RichEditor';

export function DashboardPage() {
  return (
    <div className="page-enter space-y-6">
      {/* Big date header */}
      <div className="flex items-baseline justify-between">
        <div>
          <div className="big-date text-[56px] font-bold leading-none tracking-[-0.04em]" style={{ color: 'var(--text-primary)' }}>
            {new Date().getDate()}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Main grid: priorities + blockers (left) | pomodoro (right) */}
      <div className="dashboard-grid grid gap-6" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <div className="space-y-6">
          <DailyPriorities />
          <BlockerTracker />
        </div>
        <div>
          <PomodoroTimer />
        </div>
      </div>

      {/* Scratchpad — full width */}
      <RichEditor />
    </div>
  );
}
