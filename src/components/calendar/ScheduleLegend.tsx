import { BLOCK_COLORS } from '../../lib/constants';

const LEGEND_ITEMS = [
  { type: 'work-shift', label: 'Work Shift (8:30 AM – 5:30 PM)', color: BLOCK_COLORS['work-shift'] },
  { type: 'commute', label: 'Commute (25 min buffer)', color: BLOCK_COLORS['commute'] },
  { type: 'study', label: 'Study / University', color: BLOCK_COLORS['study'] },
  { type: 'sat-shift', label: 'Saturday Shift (1st & last week)', color: BLOCK_COLORS['sat-shift'] },
];

export function ScheduleLegend() {
  return (
    <div className="card-static">
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Legend</h3>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: item.color }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
