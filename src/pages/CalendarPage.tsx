import { useEffect, Component, type ReactNode } from 'react';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useGCalStore } from '../stores/useGCalStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { seedCalendarBlocks } from '../lib/seed-calendar';
import { CalendarView } from '../components/calendar/CalendarView';
import { ScheduleLegend } from '../components/calendar/ScheduleLegend';

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export function CalendarPage() {
  const { hydrate, loading } = useCalendarStore();
  const loadGCal = useGCalStore((s) => s.loadFromStorage);
  const hydrateKanban = useKanbanStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    seedCalendarBlocks();
    loadGCal();
    hydrateKanban(); // kanban due-date tasks appear on the calendar
  }, []);

  return (
    <div className="page-enter space-y-6">
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading calendar...</p>
      ) : (
        <ErrorBoundary fallback={<p className="text-sm" style={{ color: 'var(--danger)' }}>Calendar failed to load. Try refreshing.</p>}>
          <CalendarView />
          <ScheduleLegend />
        </ErrorBoundary>
      )}
    </div>
  );
}
