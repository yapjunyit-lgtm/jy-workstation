import { useEffect } from 'react';
import { useCalendarStore } from '../stores/useCalendarStore';
import { seedCalendarBlocks } from '../lib/seed-calendar';
import { CalendarView } from '../components/calendar/CalendarView';
import { ScheduleLegend } from '../components/calendar/ScheduleLegend';

export function CalendarPage() {
  const { hydrate, loading } = useCalendarStore();

  useEffect(() => {
    hydrate();
    seedCalendarBlocks();
  }, []);

  return (
    <div className="page-enter space-y-6">
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading calendar...</p>
      ) : (
        <>
          <CalendarView />
          <ScheduleLegend />
        </>
      )}
    </div>
  );
}
