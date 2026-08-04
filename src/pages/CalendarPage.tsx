import { useEffect } from 'react';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useGCalStore } from '../stores/useGCalStore';
import { seedCalendarBlocks } from '../lib/seed-calendar';
import { CalendarView } from '../components/calendar/CalendarView';
import { ScheduleLegend } from '../components/calendar/ScheduleLegend';

export function CalendarPage() {
  const { hydrate, loading } = useCalendarStore();
  const loadGCal = useGCalStore((s) => s.loadFromStorage);

  useEffect(() => {
    hydrate();
    seedCalendarBlocks();
    loadGCal();
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
