import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { AppShell } from './components/layout/AppShell';
import { LoginScreen } from './components/auth/LoginScreen';
import { SetupScreen } from './components/auth/SetupScreen';
import { DashboardPage } from './pages/DashboardPage';
import { KanbanPage } from './pages/KanbanPage';
import { VaultPage } from './pages/VaultPage';
import { AIControlPage } from './pages/AIControlPage';
import { ImpactPage } from './pages/ImpactPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { isBridgeReachable } from './lib/cloud-sync';
import { useCloudStatusStore } from './stores/useCloudStatusStore';
import { ErrorBoundary, installGlobalErrorReporter } from './components/layout/ErrorBoundary';
import { pushAllToCloud, attachAutoPush, startRealtimeSync, stopRealtimeSync, syncNow } from './lib/cloud-sync';

function AppContent() {
  const { isLocked, isSetup, isLoading, checkAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    checkAuth().then(() => {
      setInitialized(true);
      // Wire local change hooks once — pushes go to the bridge SQLite.
      attachAutoPush();

      // Auto-connect to the local vault bridge: sync immediately, then
      // keep checking so it (re)connects if the bridge restarts.
      const setConnected = useCloudStatusStore.getState().setConnected;
      let syncing = false;

      const connect = async () => {
        const ok = await isBridgeReachable();
        setConnected(ok);
        if (ok && !syncing) {
          syncing = true;
          await syncNow().catch(() => {});
          await startRealtimeSync().catch(() => {});
          syncing = false;
        } else if (!ok) {
          stopRealtimeSync();
        }
      };

      connect();
      const healthTimer = setInterval(() => connect(), 15000);
      return () => clearInterval(healthTimer);
    });
  }, []);

  // Reconnect realtime polling whenever the tab becomes visible again
  useEffect(() => {
    if (!initialized || isLocked) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        startRealtimeSync().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [initialized, isLocked]);

  // Safety net: periodic push every 5 minutes
  useEffect(() => {
    if (!initialized || isLocked) return;
    const interval = setInterval(() => {
      pushAllToCloud().catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [initialized, isLocked]);

  if (!initialized || isLoading) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: 'var(--bg-root)' }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-3 grid place-items-center rounded-full animate-breathe"
            style={{
              width: 44,
              height: 44,
              background: 'var(--text)',
              color: 'var(--bg)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            J
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Loading your workspace…
          </p>
        </div>
      </div>
    );
  }

  // Not set up yet → show setup screen
  if (!isSetup) {
    return <SetupScreen />;
  }

  // Locked → show login
  if (isLocked) {
    return <LoginScreen />;
  }

  // Authenticated → show app
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="vault" element={<VaultPage />} />
          <Route path="ai" element={<AIControlPage />} />
          <Route path="impact" element={<ImpactPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  useEffect(() => {
    installGlobalErrorReporter();
  }, []);
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
