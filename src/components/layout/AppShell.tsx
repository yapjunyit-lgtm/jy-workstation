import { Outlet } from 'react-router-dom';
import { Rail } from './Rail';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { HelpOverlay } from './HelpOverlay';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-root)' }}>
      <Rail />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px 32px 48px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <HelpOverlay />
    </div>
  );
}
