import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  addYears, subYears, eachDayOfInterval, eachMonthOfInterval,
  isSameMonth, isToday, startOfYear,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate as useRouterNavigate, useSearchParams } from 'react-router-dom';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useGCalStore } from '../../stores/useGCalStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { TimeBlock } from './TimeBlock';
import { PillTabs } from '../layout/PillTabs';
import { AddEventModal } from './AddEventModal';
import { EditEventModal } from './EditEventModal';
import type { TimeBlock as TimeBlockType } from '../../lib/types';

type CalendarViewMode = 'year' | 'month' | 'week' | 'day';
type Blocks = TimeBlockType[];

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 52;
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const GCAL_COLOR = '#4285F4';

// Category colors for Kanban due-date tasks shown on the calendar
const KANBAN_COLORS: Record<string, string> = {
  'ai-tooling':    '#8A9FB8',
  'data-pipeline': '#8B9D83',
  'dashboarding':  '#7A9A7E',
  'automation':    '#C9A96E',
  'documentation': '#C4887C',
};
const KANBAN_ID_PREFIX = 'task:';
const VIEW_IDS: CalendarViewMode[] = ['year', 'month', 'week', 'day'];

export function CalendarView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewModeState] = useState<CalendarViewMode>(() => {
    const v = searchParams.get('view');
    return VIEW_IDS.includes(v as CalendarViewMode) ? (v as CalendarViewMode) : 'week';
  });
  const [cursorDate, setCursorDateState] = useState<Date>(() => {
    const d = searchParams.get('date');
    if (!d) return new Date();
    const parsed = new Date(d + 'T00:00:00');
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  const updateParams = (next: { view?: CalendarViewMode; date?: Date }) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (next.view) p.set('view', next.view);
      if (next.date) p.set('date', format(next.date, 'yyyy-MM-dd'));
      return p;
    }, { replace: true });
  };

  const setViewMode = (v: CalendarViewMode) => {
    setViewModeState(v);
    updateParams({ view: v });
  };

  const setCursorDate = (d: Date) => {
    setCursorDateState(d);
    updateParams({ date: d });
  };
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlockType | null>(null);
  const routerNav = useRouterNavigate();
  const wsBlocks = useCalendarStore((s) => s.blocks);
  const gcalEvents = useGCalStore((s) => s.events || []);
  const kanbanTasks = useKanbanStore((s) => s.tasks);

  const openTask = (taskId: string) => routerNav(`/kanban?task=${encodeURIComponent(taskId)}`);

  // Merge GCal events as native time blocks
  const gcalBlocks: TimeBlockType[] = useMemo(() => gcalEvents.map((e) => {
    const startH = e.isAllDay ? START_HOUR : e.start.getHours() + e.start.getMinutes() / 60;
    const endH = e.isAllDay ? END_HOUR : e.end.getHours() + e.end.getMinutes() / 60;
    return {
      id: e.uid,
      date: format(e.start, 'yyyy-MM-dd'),
      startHour: Math.max(startH, START_HOUR),
      endHour: Math.min(endH, END_HOUR),
      type: 'custom' as const,
      label: e.title,
      color: GCAL_COLOR,
    };
  }), [gcalEvents]);

  // Kanban tasks with a target date → calendar entries (due date, all-day)
  const kanbanBlocks: TimeBlockType[] = useMemo(
    () =>
      kanbanTasks
        .filter((t) => t.targetDate)
        .map((t) => ({
          id: `${KANBAN_ID_PREFIX}${t.id}`,
          date: t.targetDate as string,
          startHour: START_HOUR,
          endHour: END_HOUR,
          type: 'custom' as const,
          label: `${t.title}`,
          color: KANBAN_COLORS[t.category] || '#8B9D83',
        })),
    [kanbanTasks]
  );

  // date -> tasks (for the "Due" all-day lane in week/day views)
  const kanbanByDate = useMemo(() => {
    const map = new Map<string, typeof kanbanTasks>();
    kanbanTasks
      .filter((t) => t.targetDate)
      .forEach((t) => {
        const arr = map.get(t.targetDate as string) || [];
        arr.push(t);
        map.set(t.targetDate as string, arr);
      });
    return map;
  }, [kanbanTasks]);

  const blocks = useMemo(
    () => [...wsBlocks, ...gcalBlocks, ...kanbanBlocks],
    [wsBlocks, gcalBlocks, kanbanBlocks]
  );

  const navigate = (dir: 'prev' | 'next') => {
    const fns = {
      year: dir === 'prev' ? subYears : addYears,
      month: dir === 'prev' ? subMonths : addMonths,
      week: dir === 'prev' ? subWeeks : addWeeks,
      day: dir === 'prev' ? subDays : addDays,
    };
    setCursorDate(fns[viewMode](cursorDate, 1));
  };

  const goToday = () => setCursorDate(new Date());

  const title = useMemo(() => {
    switch (viewMode) {
      case 'year': return format(cursorDate, 'yyyy');
      case 'month': return format(cursorDate, 'MMMM yyyy');
      case 'week': {
        const ws = startOfWeek(cursorDate, { weekStartsOn: 1 });
        const we = endOfWeek(cursorDate, { weekStartsOn: 1 });
        return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
      }
      case 'day': return format(cursorDate, 'EEEE, MMMM d, yyyy');
    }
  }, [viewMode, cursorDate]);

  return (
    <div className="card-static space-y-4" style={{ padding: '16px 20px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('prev')} className="btn-sakura btn-ghost btn-sm" aria-label={`Previous ${viewMode}`}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <h3 className="text-base font-semibold min-w-[180px] text-center" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={() => navigate('next')} className="btn-sakura btn-ghost btn-sm" aria-label={`Next ${viewMode}`}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button onClick={goToday} className="btn-sakura btn-secondary btn-sm text-xs">Today</button>
          <button onClick={() => setShowAddEvent(true)} className="btn-sakura btn-primary btn-sm text-xs flex items-center gap-1">
            <Plus size={12} /> Add Event
          </button>
        </div>
        <PillTabs
          tabs={[
            { id: 'year' as const, label: 'Year' },
            { id: 'month' as const, label: 'Month' },
            { id: 'week' as const, label: 'Week' },
            { id: 'day' as const, label: 'Day' },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {viewMode==='year' && <YearGrid cursorDate={cursorDate} blocks={blocks} onSelect={(d) => { setCursorDate(d); setViewMode('month'); }} />}
      {viewMode==='month' && <MonthGrid cursorDate={cursorDate} blocks={blocks} kanbanByDate={kanbanByDate} onSelect={(d) => { setCursorDate(d); setViewMode('day'); }} onOpenTask={openTask} />}
      {viewMode==='week' && <WeekGrid cursorDate={cursorDate} blocks={blocks} kanbanByDate={kanbanByDate} onBlockClick={setEditingBlock} onOpenTask={openTask} />}
      {viewMode==='day' && <DayGrid cursorDate={cursorDate} blocks={blocks} kanbanByDate={kanbanByDate} onBlockClick={setEditingBlock} onOpenTask={openTask} />}

      {showAddEvent && <AddEventModal preselectedDate={cursorDate} onClose={() => setShowAddEvent(false)} />}
      {editingBlock && <EditEventModal block={editingBlock} onClose={() => setEditingBlock(null)} />}
    </div>
  );
}

// ── YEAR ──
function YearGrid({ cursorDate, blocks, onSelect }: { cursorDate: Date; blocks: Blocks; onSelect: (d: Date) => void }) {
  const yearStart = startOfYear(cursorDate);
  const months = eachMonthOfInterval({ start: yearStart, end: new Date(yearStart.getFullYear(), 11, 1) });
  return (
    <div className="year-grid grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {months.map((ms) => {
        const me = endOfMonth(ms);
        const days = eachDayOfInterval({ start: startOfWeek(ms, { weekStartsOn: 1 }), end: endOfWeek(me, { weekStartsOn: 1 }) });
        return (
          <div key={format(ms,'yyyy-MM')} className="rounded-lg p-2 transition-soft" style={{ background: 'var(--bg-subtle)' }}>
            <button
              type="button"
              onClick={() => onSelect(ms)}
              className="w-full text-xs font-medium mb-1 text-center rounded"
              style={{ color: 'var(--text-secondary)' }}
              aria-label={`Open ${format(ms, 'MMMM yyyy')}`}
            >
              {format(ms, 'MMM')}
            </button>
            <div className="grid gap-px" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {['M','T','W','T','F','S','S'].map((d,i) => (
                <div key={i} className="text-[8px] text-center" style={{ color: 'var(--text-tertiary)' }}>{d}</div>
              ))}
              {days.map((day) => {
                const ds = format(day,'yyyy-MM-dd');
                const hasBlock = blocks.some((b) => b.date===ds);
                const inM = isSameMonth(day, ms);
                const cur = isToday(day);
                return (
                  <button
                    key={ds}
                    type="button"
                    className="text-[9px] text-center rounded-sm relative"
                    style={{ color: !inM ? 'var(--text-tertiary)' : cur ? 'white' : 'var(--text-primary)', background: cur ? 'var(--accent)' : 'transparent', opacity: !inM ? 0.3 : 1, padding: '1px 0' }}
                    onClick={() => onSelect(day)}
                    aria-label={format(day, 'EEEE, MMMM d')}
                  >
                    {hasBlock && <span className="absolute top-0 right-0.5 w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} aria-hidden="true" />}
                    {format(day,'d')}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MONTH ──
function MonthGrid({ cursorDate, blocks, kanbanByDate, onSelect, onOpenTask }: {
  cursorDate: Date; blocks: Blocks;
  kanbanByDate: Map<string, { id: string; title: string; category: string }[]>;
  onSelect: (d: Date) => void; onOpenTask: (id: string) => void;
}) {
  const ms = startOfMonth(cursorDate);
  const me = endOfMonth(cursorDate);
  const days = eachDayOfInterval({ start: startOfWeek(ms, { weekStartsOn: 1 }), end: endOfWeek(me, { weekStartsOn: 1 }) });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      <div className="grid gap-px mb-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAYS_SHORT.map((d) => <div key={d} className="text-[11px] text-center py-1 font-medium" style={{ color: 'var(--text-muted)' }}>{d}</div>)}
      </div>
      <div className="space-y-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid gap-px" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {week.map((day) => {
              const ds = format(day,'yyyy-MM-dd');
              const dayBlocks = blocks.filter((b) => b.date===ds);
              const inM = isSameMonth(day, ms);
              const cur = isToday(day);
              return (
                <div key={ds} className="rounded-lg p-1.5 min-h-[90px] border transition-soft"
                  style={{ background: !inM ? 'var(--bg-root)' : cur ? 'var(--accent-soft)' : 'var(--bg-surface)', borderColor: cur ? 'var(--accent)' : 'var(--border-color)', opacity: !inM ? 0.4 : 1 }}>
                  <button
                    type="button"
                    onClick={() => onSelect(day)}
                    className="block w-full text-xs font-medium mb-0.5 text-left rounded"
                    style={{ color: cur ? 'var(--accent)' : inM ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    aria-label={format(day, 'EEEE, MMMM d')}
                  >
                    {format(day,'d')}
                  </button>
                  {dayBlocks.slice(0,2).map((b) => (
                    <div key={b.id} className="text-[10px] truncate rounded px-1 py-0.5 mb-0.5"
                      style={{ background: b.color+'30', borderLeft: `2px solid ${b.color}`, color: 'var(--text-primary)' }}>{b.label}</div>
                  ))}
                  {(kanbanByDate.get(ds) || []).slice(0,1).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="block w-full text-[10px] truncate rounded px-1 py-0.5 mb-0.5 text-left cursor-pointer transition-soft"
                      title={`Open Kanban task: ${t.title}`}
                      style={{ background: (KANBAN_COLORS[t.category] || '#8B9D83')+'25', borderLeft: `2px solid ${KANBAN_COLORS[t.category] || '#8B9D83'}`, color: 'var(--text-primary)' }}
                      onClick={() => onOpenTask(t.id)}
                      aria-label={`Open kanban task: ${t.title}`}
                    >
                      {t.title}
                    </button>
                  ))}
                  {(dayBlocks.length + (kanbanByDate.get(ds) || []).length) > 3 && <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>+ more</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WEEK ──
function WeekGrid({ cursorDate, blocks, kanbanByDate, onBlockClick, onOpenTask }: {
  cursorDate: Date; blocks: Blocks;
  kanbanByDate: Map<string, { id: string; title: string; category: string }[]>;
  onBlockClick: (b: TimeBlockType) => void; onOpenTask: (id: string) => void;
}) {
  const ws = startOfWeek(cursorDate, { weekStartsOn: 1 });
  const now = new Date();
  const curH = now.getHours() + now.getMinutes()/60;
  const hours = Array.from({ length: END_HOUR-START_HOUR+1 }, (_, i) => START_HOUR+i);
  const th = (END_HOUR-START_HOUR)*HOUR_HEIGHT;
  return (
    <div className="overflow-x-auto">
      <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div style={{ width:48, flexShrink:0 }} />
        {DAYS_SHORT.map((day, i) => {
          const date = addDays(ws, i);
          const cur = isToday(date);
          return <div key={day} className="flex-1 text-center py-2 min-w-[80px]" style={{ color: cur ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: cur?500:400 }}>
            <div className="text-[10px]">{day}</div><div className="text-sm">{format(date,'d')}</div>
          </div>;
        })}
      </div>

      {/* Kanban due-date lane */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-subtle)' }}>
        <div className="flex-shrink-0 flex items-center justify-end pr-2 text-[9px] uppercase tracking-wide" style={{ width:48, color:'var(--text-tertiary)' }}>Due</div>
        {DAYS_SHORT.map((_, di) => {
          const date = addDays(ws, di);
          const ds = format(date,'yyyy-MM-dd');
          const due = kanbanByDate.get(ds) || [];
          return <div key={di} className="flex-1 min-w-[80px] px-1 py-1 border-l space-y-0.5" style={{ borderColor:'var(--border-color)' }}>
            {due.length === 0 && <div className="text-[9px] text-center" style={{ color:'var(--text-tertiary)' }}>—</div>}
            {due.slice(0,3).map((t) => (
              <button
                key={t.id}
                type="button"
                className="block w-full text-[10px] truncate rounded px-1 py-0.5 text-left cursor-pointer transition-soft"
                title={`Open Kanban task: ${t.title}`}
                style={{ background: (KANBAN_COLORS[t.category] || '#8B9D83')+'25', borderLeft: `2px solid ${KANBAN_COLORS[t.category] || '#8B9D83'}`, color: 'var(--text-primary)' }}
                onClick={() => onOpenTask(t.id)}
                aria-label={`Open kanban task: ${t.title}`}
              >
                {t.title}
              </button>
            ))}
            {due.length > 3 && <div className="text-[9px]" style={{ color:'var(--text-tertiary)' }}>+{due.length-3} more</div>}
          </div>;
        })}
      </div>

      <div className="flex relative" style={{ height:th }}>
        <div className="flex-shrink-0 relative" style={{ width:48 }}>
          {hours.map((h) => <div key={h} className="absolute right-2 text-[10px]" style={{ top:(h-START_HOUR)*HOUR_HEIGHT-6, color:'var(--text-tertiary)' }}>
            {h>12?h-12:h===0?12:h}{h>=12?'p':'a'}
          </div>)}
        </div>
        {DAYS_SHORT.map((_, di) => {
          const date = addDays(ws, di);
          const ds = format(date,'yyyy-MM-dd');
          const dayBlocks = blocks.filter((b) => b.date===ds);
          const cur = isToday(date);
          return <div key={di} className="flex-1 relative min-w-[80px] border-l" style={{ borderColor:'var(--border-color)' }}>
            {hours.map((h) => <div key={h} className="absolute left-0 right-0 border-t" style={{ top:(h-START_HOUR)*HOUR_HEIGHT, borderColor:'var(--border-color)', opacity:0.5 }} />)}
            {dayBlocks.map((b) => <TimeBlock key={b.id} block={b} hourHeight={HOUR_HEIGHT} startHour={START_HOUR} onClick={b.id.startsWith(KANBAN_ID_PREFIX) ? () => onOpenTask(b.id.slice(KANBAN_ID_PREFIX.length)) : onBlockClick} />)}
            {cur && curH>=START_HOUR && curH<=END_HOUR && (
              <div className="absolute left-0 right-0 z-10 flex items-center" style={{ top:(curH-START_HOUR)*HOUR_HEIGHT }}>
                <div className="w-2 h-2 rounded-full -ml-1" style={{ background:'var(--danger)' }} /><div className="flex-1 h-px" style={{ background:'var(--danger)' }} />
              </div>
            )}
            {cur && <div className="absolute inset-0 pointer-events-none" style={{ background:'var(--accent-soft)', opacity:0.1 }} />}
          </div>;
        })}
      </div>
    </div>
  );
}

// ── DAY ──
function DayGrid({ cursorDate, blocks, kanbanByDate, onBlockClick, onOpenTask }: {
  cursorDate: Date; blocks: Blocks;
  kanbanByDate: Map<string, { id: string; title: string; category: string }[]>;
  onBlockClick: (b: TimeBlockType) => void; onOpenTask: (id: string) => void;
}) {
  const ds = format(cursorDate,'yyyy-MM-dd');
  const dayBlocks = blocks.filter((b) => b.date===ds);
  const hours = Array.from({ length: END_HOUR-START_HOUR+1 }, (_, i) => START_HOUR+i);
  const now = new Date();
  const curH = now.getHours()+now.getMinutes()/60;
  const cur = isToday(cursorDate);
  const due = kanbanByDate.get(ds) || [];
  return (
    <div>
      {/* Kanban due-date chips */}
      {due.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
          <span className="text-[10px] uppercase tracking-wide self-center" style={{ color: 'var(--text-tertiary)' }}>Due:</span>
          {due.map((t) => (
            <button
              key={t.id}
              type="button"
              className="text-[11px] rounded px-2 py-0.5 cursor-pointer transition-soft"
              title={`Open Kanban task: ${t.title}`}
              style={{ background: (KANBAN_COLORS[t.category] || '#8B9D83')+'25', borderLeft: `2px solid ${KANBAN_COLORS[t.category] || '#8B9D83'}`, color: 'var(--text-primary)' }}
              onClick={() => onOpenTask(t.id)}
              aria-label={`Open kanban task: ${t.title}`}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
      {hours.map((hour) => {
        const hb = dayBlocks.filter((b) => b.startHour>=hour && b.startHour<hour+1);
        const show = cur && curH>=hour && curH<hour+1;
        return (
          <div key={hour} className="flex border-t min-h-[52px]" style={{ borderColor:'var(--border-color)' }}>
            <div className="flex-shrink-0 py-1 pr-3 text-right" style={{ width:48 }}>
              <span className="text-[10px]" style={{ color:'var(--text-tertiary)' }}>{hour>12?hour-12:hour===0?12:hour}{hour>=12?' PM':' AM'}</span>
            </div>
            <div className="flex-1 py-1 relative border-l" style={{ borderColor:'var(--border-color)' }}>
              {show && (
                <div className="absolute left-0 right-0 z-10 flex items-center" style={{ top:`${((curH-hour)/1)*100}%` }}>
                  <div className="w-2 h-2 rounded-full -ml-1" style={{ background:'var(--danger)' }} /><div className="flex-1 h-px" style={{ background:'var(--danger)' }} />
                </div>
              )}
              {hb.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="rounded px-2 py-1 ml-1 mr-2 text-xs cursor-pointer hover:brightness-95"
                  style={{
                    background: b.color+'25',
                    border: 'none',
                    borderLeft: `3px solid ${b.color}`,
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    display: 'block',
                    width: 'calc(100% - 12px)',
                  }}
                  onClick={b.id.startsWith(KANBAN_ID_PREFIX) ? () => onOpenTask(b.id.slice(KANBAN_ID_PREFIX.length)) : () => onBlockClick(b)}
                  aria-label={`Open event: ${b.label}`}
                >
                  <span className="font-medium">{b.label}</span>
                  <span className="ml-2" style={{ color:'var(--text-tertiary)', fontSize:10 }}>{fmtHr(b.startHour)} – {fmtHr(b.endHour)}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fmtHr(hour: number): string {
  const h = Math.floor(hour), m = Math.round((hour-h)*60);
  const ampm = h>=12?'PM':'AM';
  const h12 = h>12?h-12:h===0?12:h;
  return m>0?`${h12}:${m.toString().padStart(2,'0')}${ampm}`:`${h12}${ampm}`;
}
