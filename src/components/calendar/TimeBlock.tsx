import type { TimeBlock as TimeBlockType } from '../../lib/types';

interface TimeBlockProps {
  block: TimeBlockType;
  hourHeight: number;
  startHour: number;
  onClick?: (block: TimeBlockType) => void;
}

export function TimeBlock({ block, hourHeight, startHour, onClick }: TimeBlockProps) {
  const top = (block.startHour - startHour) * hourHeight;
  const height = (block.endHour - block.startHour) * hourHeight;

  return (
    <button
      type="button"
      className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden text-xs cursor-pointer hover:brightness-95"
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 20)}px`,
        background: block.color + '25',
        border: 'none',
        borderLeft: `3px solid ${block.color}`,
        color: 'var(--text-primary)',
        lineHeight: 1.3,
        textAlign: 'left',
        display: 'block',
        fontFamily: 'inherit',
      }}
      onClick={(e) => { e.stopPropagation(); onClick?.(block); }}
      aria-label={`Open event: ${block.label}`}
    >
      <div className="font-medium truncate">{block.label}</div>
      {height > 30 && (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
          {formatHour(block.startHour)} – {formatHour(block.endHour)}
        </div>
      )}
    </button>
  );
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m > 0 ? `${h12}:${m.toString().padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`;
}
