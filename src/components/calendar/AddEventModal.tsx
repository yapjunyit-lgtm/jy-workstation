import { useState } from 'react';
import { X, CalendarPlus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { generateGoogleCalendarLink } from '../../lib/ics-parser';
import type { BlockType } from '../../lib/types';

const CATEGORIES: { type: BlockType; label: string; color: string; emoji: string }[] = [
  { type: 'work-shift',   label: 'Work',     color: '#C9A96E', emoji: '💼' },
  { type: 'study',        label: 'Study',    color: '#8A9FB8', emoji: '📚' },
  { type: 'custom',       label: 'Personal', color: '#8B9D83', emoji: '🏠' },
  { type: 'sat-shift',    label: 'Health',   color: '#C4887C', emoji: '🏃' },
  { type: 'commute',      label: 'Travel',   color: '#D5CFC6', emoji: '✈️' },
];

interface AddEventModalProps {
  preselectedDate?: Date;
  onClose: () => void;
}

export function AddEventModal({ preselectedDate, onClose }: AddEventModalProps) {
  const addBlock = useCalendarStore((s) => s.addBlock);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(preselectedDate ? format(preselectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(date);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [multiDay, setMultiDay] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [added, setAdded] = useState(false);

  const handleAddLocal = async () => {
    if (!title.trim()) return;

    const startH = allDay ? 6 : parseTime(startTime);
    const endH = allDay ? 22 : parseTime(endTime);
    const label = description.trim() ? `${title.trim()} — ${description.trim().slice(0, 60)}` : title.trim();

    if (multiDay) {
      // Create one block per day
      const start = new Date(date + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      const days: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(format(d, 'yyyy-MM-dd'));
      }
      for (const day of days) {
        await addBlock(day, startH, endH, category.type, label);
      }
    } else {
      await addBlock(date, startH, endH, category.type, title.trim());
    }
    setAdded(true);
  };

  const handleAddGoogle = () => {
    if (!title.trim()) return;

    const startStr = allDay
      ? date.replace(/-/g, '')
      : date.replace(/-/g, '') + 'T' + startTime.replace(':', '') + '00';
    const endStr = allDay
      ? date.replace(/-/g, '')
      : date.replace(/-/g, '') + 'T' + endTime.replace(':', '') + '00';

    const link = generateGoogleCalendarLink({
      title: title.trim(),
      startDate: startStr,
      endDate: endStr,
      details: description.trim(),
      location: location.trim(),
    });

    window.open(link, '_blank');
  };

  const handleBoth = () => {
    handleAddLocal();
    handleAddGoogle();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      style={{ background: 'rgba(59, 56, 51, 0.15)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card-static w-full max-w-md mx-4 shadow-xl animate-scaleIn space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarPlus size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Add Event</h3>
          </div>
          <button onClick={onClose} className="btn-sakura btn-ghost btn-sm"><X size={14} /></button>
        </div>

        {added ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm" style={{ color: 'var(--success)' }}>✅ Added to workstation calendar</p>
            <button onClick={handleAddGoogle} className="btn-sakura btn-secondary btn-sm flex items-center gap-1.5 mx-auto">
              <ExternalLink size={12} /> Also add to Google Calendar
            </button>
            <br />
            <button onClick={onClose} className="btn-sakura btn-ghost btn-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="input-sakura text-sm" autoFocus />

              {/* Category picker */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.type}
                    onClick={() => setCategory(cat)}
                    className="text-[11px] px-2 py-1 rounded-full transition-soft border flex items-center gap-1"
                    style={{
                      color: category.type === cat.type ? 'white' : cat.color,
                      background: category.type === cat.type ? cat.color : 'transparent',
                      borderColor: cat.color,
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input type="date" value={date} onChange={(e) => { setDate(e.target.value); if (!multiDay) setEndDate(e.target.value); }} className="input-sakura text-sm flex-1" />
                  {multiDay && (
                    <>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>to</span>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-sakura text-sm flex-1" />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                    All day
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={multiDay} onChange={(e) => setMultiDay(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                    Multi-day
                  </label>
                </div>
              </div>

              {!allDay && (
                <div className="flex items-center gap-3">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-sakura text-sm flex-1" />
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>to</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-sakura text-sm flex-1" />
                </div>
              )}

              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location or video link (optional)" className="input-sakura text-sm" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description or notes (optional)" className="input-sakura text-sm" rows={2} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button onClick={handleAddGoogle} className="btn-sakura btn-ghost btn-sm text-xs flex items-center gap-1" disabled={!title.trim()}>
                <ExternalLink size={11} /> Google
              </button>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="btn-sakura btn-ghost btn-sm text-xs">Cancel</button>
                <button onClick={handleBoth} disabled={!title.trim()} className="btn-sakura btn-primary btn-sm">
                  Add to Both
                </button>
                <button onClick={() => { handleAddLocal(); }} disabled={!title.trim()} className="btn-sakura btn-secondary btn-sm">
                  Add Local
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}
