import { motion } from 'framer-motion';

interface PillTabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

const SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 } as const;

export function PillTabs<T extends string>({ tabs, value, onChange }: PillTabsProps<T>) {
  return (
    <div
      className="inline-flex items-center gap-0.5 p-1 rounded-full"
      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative px-3.5 py-1.5 text-xs rounded-full transition-colors"
            style={{
              color: active ? 'var(--accent-fg)' : 'var(--text-muted)',
              fontWeight: active ? 600 : 500,
            }}
          >
            {active && (
              <motion.span
                layoutId="pill-tabs-active"
                transition={SPRING}
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--text)', boxShadow: 'var(--shadow-card-contact)' }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
