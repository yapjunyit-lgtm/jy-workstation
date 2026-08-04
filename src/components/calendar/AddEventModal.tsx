import { useState } from 'react';
import { X, CalendarPlus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { generateGoogleCalendarLink } from '../../lib/ics-parser';

interface AddEventModalProps {
  preselectedDate?: Date;
  onClose: () => void;
}

export function AddEventModal({ preselectedDate, onClose }: AddEventModalProps) {
  const addBlock = useCalendarStore((s) => s.addBlock);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(preselectedDate ? format(preselectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [added, setAdded] = useState(false);

  const handleAddLocal = async () => {
    if (!title.trim()) return;

    const startH = allDay ? 8 : parseTime(startTime);
    const endH = allDay ? 18 : parseTime(endTime);

    await addBlock(date, startH, endH, 'custom', title.trim());
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

              <div className="flex items-center gap-3">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-sakura text-sm flex-1" />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                  All day
                </label>
              </div>

              {!allDay && (
                <div className="flex items-center gap-3">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-sakura text-sm flex-1" />
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>to</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-sakura text-sm flex-1" />
                </div>
              )}

              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" className="input-sakura text-sm" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="input-sakura text-sm" rows={2} />
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
