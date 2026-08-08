import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Kanban, BookOpen, Bot, TrendingUp, CalendarDays, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard', kbd: '1' },
  { to: '/kanban',   icon: Kanban,          label: 'Kanban',    kbd: '2' },
  { to: '/vault',    icon: BookOpen,        label: 'Vault',     kbd: '3' },
  { to: '/ai',       icon: Bot,             label: 'AI Vault',  kbd: '4' },
  { to: '/impact',   icon: TrendingUp,      label: 'Impact',    kbd: '5' },
  { to: '/calendar', icon: CalendarDays,    label: 'Calendar',  kbd: '6' },
];

export function Rail() {
  const location = useLocation();
  const isActive = (to: string) => location.pathname === to || (to === '/' && location.pathname === '/');

  return (
    <aside
      className="app-rail flex flex-col items-center border-r"
      style={{
        width: 56,
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        padding: '12px 0',
        gap: 4,
      }}
    >
      {/* Logo */}
      <div
        className="rail-logo flex items-center justify-center rounded-lg mb-3"
        style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, var(--accent), var(--info))',
          color: 'white',
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        J
      </div>

      <div className="rail-divider" style={{ width: 24, height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

      {/* Nav items */}
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className="relative flex items-center justify-center rounded-lg transition-soft"
          style={{
            width: 36, height: 36,
            color: isActive(item.to) ? 'var(--accent)' : 'var(--text-muted)',
            background: isActive(item.to) ? 'var(--accent-soft)' : 'transparent',
          }}
          title={`${item.label} (⌘${item.kbd})`}
        >
          {isActive(item.to) && (
            <div
              style={{
                position: 'absolute',
                left: 0, top: 8, bottom: 8,
                width: 2,
                background: 'var(--accent)',
                borderRadius: '0 2px 2px 0',
              }}
            />
          )}
          <item.icon size={18} />
          <span
            className="rail-kbd absolute top-0.5 right-0.5"
            style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-tertiary)' }}
          >
            {item.kbd}
          </span>
        </NavLink>
      ))}

      <div className="rail-spacer flex-1" />

      {/* Settings */}
      <NavLink
        to="/settings"
        className="flex items-center justify-center rounded-lg transition-soft"
        style={{
          width: 36, height: 36,
          color: location.pathname === '/settings' ? 'var(--accent)' : 'var(--text-muted)',
          background: location.pathname === '/settings' ? 'var(--accent-soft)' : 'transparent',
        }}
        title="Settings"
      >
        <Settings size={18} />
      </NavLink>
    </aside>
  );
}
