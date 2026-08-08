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
import { isFirebaseConfigured, onFirebaseAuthChange } from './lib/firebase';
import { ErrorBoundary, installGlobalErrorReporter } from './components/layout/ErrorBoundary';
import { pushAllToCloud, pullAllFromCloud, attachAutoPush, startRealtimeSync } from './lib/cloud-sync';

function AppContent() {
  const { isLocked, isSetup, isLoading, checkAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    checkAuth().then(() => {
      setInitialized(true);
      // Wire change hooks once (they no-op until signed in + visible)
      if (isFirebaseConfigured()) attachAutoPush();

      // Only sync when a cloud account is already signed in — never
      // auto-sign-in from a background timer (Firebase Auth closes its
      // IndexedDB when the tab is hidden, producing rejections).
      let started = false;
      onFirebaseAuthChange((user) => {
        if (user && !started) {
          started = true;
          startRealtimeSync().catch(() => {});
          pushAllToCloud()
            .then(() => pullAllFromCloud())
            .catch(() => {});
        }
      });
    });
  }, []);

  // Safety net: periodic push every 5 minutes if configured
  useEffect(() => {
    if (!initialized || isLocked) return;
    if (!isFirebaseConfigured()) return;
    const interval = setInterval(() => {
      pushAllToCloud().catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [initialized, isLocked]);

  if (!initialized || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-root)' }}
      >
        <div className="text-center">
          <div className="text-3xl mb-3 animate-breathe">🌿</div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Loading your workspace...
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
