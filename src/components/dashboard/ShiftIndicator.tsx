import { getShiftInfo } from '../../lib/utils';

export function ShiftIndicator() {
  const shift = getShiftInfo();

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: shift.type === 'weekday'
          ? '#E2EDE4'
          : shift.type === 'sat-shift'
          ? '#F3E4E0'
          : 'var(--bg-subtle)',
        color: shift.color,
      }}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: shift.color }} />
      {shift.label}
    </span>
  );
}
