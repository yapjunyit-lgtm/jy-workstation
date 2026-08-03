import { useEffect } from 'react';
import { useCalendarStore } from '../stores/useCalendarStore';
import { seedCalendarBlocks } from '../lib/seed-calendar';
import { WeekView } from '../components/calendar/WeekView';
import { ScheduleLegend } from '../components/calendar/ScheduleLegend';

export function CalendarPage() {
  const { hydrate, loading } = useCalendarStore();

  useEffect(() => {
    hydrate();
    seedCalendarBlocks();
  }, []);

  return (
    <div className="page-enter space-y-6">
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
        📅 Calendar
      </h2>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading calendar...</p>
      ) : (
        <>
          <WeekView />
          <ScheduleLegend />
        </>
      )}
    </div>
  );
}
