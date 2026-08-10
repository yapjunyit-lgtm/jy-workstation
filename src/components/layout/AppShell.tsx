import { Outlet } from 'react-router-dom';
import { Rail } from './Rail';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { HelpOverlay } from './HelpOverlay';

export function AppShell() {
  return (
    <div className="grain-overlay flex" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only"
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 100,
          background: 'var(--text)',
          color: 'var(--bg)',
          padding: '8px 14px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Skip to content
      </a>
      <Rail />
      <div className="flex flex-col flex-1" style={{ minWidth: 0, minHeight: 0 }}>
        <TopBar />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 overflow-auto"
          style={{ padding: '28px 36px 64px', outline: 'none', minHeight: 0, overscrollBehavior: 'contain' }}
        >
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
