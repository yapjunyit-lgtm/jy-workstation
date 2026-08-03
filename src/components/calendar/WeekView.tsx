import { useMemo } from 'react';
import {
  startOfWeek, addDays, format, isToday,
} from 'date-fns';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { TimeBlock } from './TimeBlock';

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 48;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TOTAL_HOURS = END_HOUR - START_HOUR;

export function WeekView() {
  const { blocks } = useCalendarStore();

  const weekStart = useMemo(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  }, []);

  const today = new Date();
  const currentHour = today.getHours() + today.getMinutes() / 60;

  const hours = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  }, []);

  const totalHeight = TOTAL_HOURS * HOUR_HEIGHT;

  return (
    <div className="card-static overflow-x-auto" style={{ padding: '12px' }}>
      {/* Day headers */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div style={{ width: 48, flexShrink: 0 }} />
        {DAYS.map((day, i) => {
          const date = addDays(weekStart, i);
          const isCurrentDay = isToday(date);
          return (
            <div
              key={day}
              className="flex-1 text-center py-2 min-w-[80px]"
              style={{
                color: isCurrentDay ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isCurrentDay ? 500 : 400,
              }}
            >
              <div className="text-[10px]">{day}</div>
              <div className="text-sm">{format(date, 'd')}</div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex relative" style={{ height: totalHeight }}>
        {/* Time labels */}
        <div className="flex-shrink-0 relative" style={{ width: 48 }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute right-2 text-[10px]"
              style={{
                top: (hour - START_HOUR) * HOUR_HEIGHT - 6,
                color: 'var(--text-tertiary)',
              }}
            >
              {hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}{hour >= 12 ? 'p' : 'a'}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((_, dayIndex) => {
          const date = addDays(weekStart, dayIndex);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayBlocks = blocks.filter((b) => b.date === dateStr);
          const isCurrentDay = isToday(date);

          return (
            <div key={dayIndex} className="flex-1 relative min-w-[80px] border-l" style={{ borderColor: 'var(--border-color)' }}>
              {/* Hour grid lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t"
                  style={{
                    top: (hour - START_HOUR) * HOUR_HEIGHT,
                    borderColor: 'var(--border-color)',
                    opacity: 0.5,
                  }}
                />
              ))}

              {/* Time blocks */}
              {dayBlocks.map((block) => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  hourHeight={HOUR_HEIGHT}
                  startHour={START_HOUR}
                />
              ))}

              {/* Current time indicator */}
              {isCurrentDay && currentHour >= START_HOUR && currentHour <= END_HOUR && (
                <div
                  className="absolute left-0 right-0 z-10 flex items-center"
                  style={{ top: (currentHour - START_HOUR) * HOUR_HEIGHT }}
                >
                  <div className="w-2 h-2 rounded-full -ml-1" style={{ background: 'var(--danger)' }} />
                  <div className="flex-1 h-px" style={{ background: 'var(--danger)' }} />
                </div>
              )}

              {/* Today highlight */}
              {isCurrentDay && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--accent-soft)', opacity: 0.15 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
