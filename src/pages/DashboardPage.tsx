import { DailyPriorities } from '../components/dashboard/DailyPriorities';
import { PomodoroTimer } from '../components/dashboard/PomodoroTimer';
import { BlockerTracker } from '../components/dashboard/BlockerTracker';
import { RichEditor } from '../components/scratchpad/RichEditor';

export function DashboardPage() {
  return (
    <div className="page-enter">
      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 200px' }}>
        {/* Main column */}
        <div className="space-y-6">
          <DailyPriorities />
          <RichEditor />
          <BlockerTracker />
        </div>

        {/* Side column */}
        <div>
          <PomodoroTimer />
        </div>
      </div>
    </div>
  );
}
