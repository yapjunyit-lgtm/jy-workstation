import { Outlet } from 'react-router-dom';
import { Rail } from './Rail';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { HelpOverlay } from './HelpOverlay';

export function AppShell() {
  return (
    <div className="grain-overlay flex" style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <Rail />
      <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
        <TopBar />
        <main className="flex-1" style={{ padding: '28px 36px 64px' }}>
          <div className="mx-auto" style={{ maxWidth: 1400 }}>
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <HelpOverlay />
    </div>
  );
}
