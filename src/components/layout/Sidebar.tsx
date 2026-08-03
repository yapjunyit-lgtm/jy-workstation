import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Kanban, BookOpen, TrendingUp, CalendarDays, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',            icon: LayoutDashboard,  label: 'Dashboard' },
  { to: '/kanban',      icon: Kanban,           label: 'Kanban' },
  { to: '/vault',       icon: BookOpen,         label: 'Vault' },
  { to: '/impact',      icon: TrendingUp,        label: 'Impact' },
  { to: '/calendar',    icon: CalendarDays,      label: 'Calendar' },
];

export function Sidebar() {
  return (
    <aside
      className="flex flex-col h-screen sticky top-0 border-r"
      style={{ width: 220, background: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
    >
      {/* Logo area */}
      <div className="px-5 py-5">
        <h1
          className="text-base font-medium tracking-wide"
          style={{ color: 'var(--text-primary)' }}
        >
          🌿 JY Workstation
        </h1>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-soft"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-soft)' : 'transparent',
              fontWeight: isActive ? 450 : 400,
            })}
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-4">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-soft"
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-soft)' : 'transparent',
          })}
        >
          <Settings size={18} />
          <span className="text-sm">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
