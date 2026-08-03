import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { HelpOverlay } from './HelpOverlay';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-root)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <StatusBar />
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px 32px' }}>
          <div className="max-w-content mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <HelpOverlay />
    </div>
  );
}
