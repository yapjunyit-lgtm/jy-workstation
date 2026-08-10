import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Kanban, BookOpen, Bot, TrendingUp, CalendarDays, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard', kbd: '1' },
  { to: '/kanban',   icon: Kanban,          label: 'Kanban',    kbd: '2' },
  { to: '/vault',    icon: BookOpen,        label: 'Vault',     kbd: '3' },
  { to: '/ai',       icon: Bot,             label: 'AI Vault',  kbd: '4' },
  { to: '/impact',   icon: TrendingUp,      label: 'Impact',    kbd: '5' },
  { to: '/calendar', icon: CalendarDays,    label: 'Calendar',  kbd: '6' },
];

const SPRING = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 } as const;

export function Rail() {
  const location = useLocation();
  const isActive = (to: string) => location.pathname === to || (to === '/' && location.pathname === '/');

  return (
    <aside
      className="flex flex-col items-center border-r"
      style={{
        width: 64,
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
        padding: '16px 0 12px',
        gap: 2,
      }}
    >
      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: 34,
          height: 34,
          background: 'var(--text)',
          color: 'var(--bg)',
          fontWeight: 800,
          fontSize: 15,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          boxShadow: 'var(--shadow-card-contact)',
        }}
        title="JY Workstation"
      >
        J
      </motion.div>

      <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '2px 0 6px' }} />

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1">
        {NAV_ITEMS.map((item, i) => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="relative flex items-center justify-center rounded-full"
              style={{
                width: 42,
                height: 42,
                color: active ? 'var(--accent-fg)' : 'var(--text-muted)',
              }}
              title={`${item.label} (⌘${item.kbd})`}
            >
              {active && (
                <motion.span
                  layoutId="rail-active-pill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--text)', boxShadow: 'var(--shadow-card-contact)' }}
                />
              )}
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i }}
                className="relative flex items-center justify-center"
              >
                <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              </motion.span>
              <span
                className="absolute top-0.5 right-0.5"
                style={{
                  fontSize: 8,
                  fontFamily: 'var(--font-mono)',
                  color: active ? 'color-mix(in oklch, var(--bg) 70%, transparent)' : 'var(--text-faint)',
                }}
              >
                {item.kbd}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Settings */}
      <NavLink
        to="/settings"
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 42,
          height: 42,
          color: location.pathname === '/settings' ? 'var(--accent-fg)' : 'var(--text-muted)',
        }}
        title="Settings"
      >
        {location.pathname === '/settings' && (
          <motion.span
            layoutId="rail-active-pill"
            transition={SPRING}
            className="absolute inset-0 rounded-full"
            style={{ background: 'var(--text)', boxShadow: 'var(--shadow-card-contact)' }}
          />
        )}
        <Settings size={18} strokeWidth={location.pathname === '/settings' ? 2.2 : 1.8} className="relative" />
      </NavLink>
    </aside>
  );
}
