import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSyncStore } from '../stores/useSyncStore';
import { useGCalStore } from '../stores/useGCalStore';
import { exportAllAsMarkdownZip, exportFullBackupJSON, importFullBackupJSON } from '../lib/sync';
import { isFirebaseConfigured, configureFirebase, getFirebaseConfig, clearFirebaseConfig } from '../lib/firebase';
import { pushAllToCloud, pullAllFromCloud, getCloudStats } from '../lib/cloud-sync';
import type { FirebaseConfig } from '../lib/firebase';

type SettingsTab = 'auth' | 'sync' | 'calendar' | 'cloud' | 'backup';

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('auth');

  return (
    <div className="page-enter space-y-6">
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>⚙️ Settings</h2>

      <div className="flex items-center gap-1 border-b pb-0" style={{ borderColor: 'var(--border-color)' }}>
        {([
          { id: 'auth' as const, label: 'Auth' },
          { id: 'sync' as const, label: 'Obsidian Sync' },
          { id: 'calendar' as const, label: 'Calendar' },
          { id: 'cloud' as const, label: 'Cloud Sync' },
          { id: 'backup' as const, label: 'Backup' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-sm transition-soft border-b-2 -mb-px"
            style={{
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderColor: tab === t.id ? 'var(--accent)' : 'transparent',
              fontWeight: tab === t.id ? 450 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'auth' && <AuthTab />}
      {tab === 'sync' && <SyncTab />}
      {tab === 'calendar' && <CalendarTab />}
      {tab === 'cloud' && <CloudTab />}
      {tab === 'backup' && <BackupTab />}
    </div>
  );
}

// ── Auth Tab ──
function AuthTab() {
  const { changePassphrase, lock, error, clearError } = useAuthStore();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');

  const handleChange = async () => {
    clearError();
    setMsg('');
    if (newPw.length < 8) { setMsg('New passphrase must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setMsg('Passphrases do not match'); return; }
    const ok = await changePassphrase(oldPw, newPw);
    if (ok) {
      setMsg('Passphrase changed successfully');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    }
  };

  return (
    <div className="card-static max-w-md space-y-4">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Change Passphrase</h3>
      <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="Current passphrase" className="input-sakura text-sm" />
      <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New passphrase (min 8 chars)" className="input-sakura text-sm" />
      <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new passphrase" className="input-sakura text-sm" />
      {(msg || error) && (
        <p className="text-xs" style={{ color: msg.includes('success') ? 'var(--success)' : 'var(--danger)' }}>{msg || error}</p>
      )}
      <button onClick={handleChange} className="btn-sakura btn-primary btn-sm">Update Passphrase</button>

      <hr style={{ borderColor: 'var(--border-color)' }} />

      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Lock Workspace</h3>
        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
          Immediately locks the app. You will need your passphrase to unlock.
        </p>
        <button onClick={lock} className="btn-sakura btn-danger btn-sm">Lock Now</button>
      </div>
    </div>
  );
}

// ── Sync Tab ──
function SyncTab() {
  const { config, updateConfig, isExporting, setExporting } = useSyncStore();

  const handleExport = async () => {
    setExporting(true);
    await exportAllAsMarkdownZip();
    await updateConfig({ lastExportAt: Date.now() });
    setExporting(false);
  };

  return (
    <div className="card-static max-w-md space-y-4">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Obsidian Sync</h3>

      <div>
        <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Vault Name</label>
        <input value={config.vaultName} onChange={(e) => updateConfig({ vaultName: e.target.value })} className="input-sakura text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Daily Note Folder</label>
          <input value={config.dailyNoteFolder} onChange={(e) => updateConfig({ dailyNoteFolder: e.target.value })} className="input-sakura text-sm" />
        </div>
        <div>
          <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>STAR Folder</label>
          <input value={config.starFolder} onChange={(e) => updateConfig({ starFolder: e.target.value })} className="input-sakura text-sm" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm" style={{ color: 'var(--text-primary)' }}>Auto-export</label>
        <button
          onClick={() => updateConfig({ autoExportEnabled: !config.autoExportEnabled })}
          className="w-10 h-5 rounded-full relative transition-soft"
          style={{ background: config.autoExportEnabled ? 'var(--accent)' : 'var(--border-color)' }}
        >
          <div
            className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-soft shadow-sm"
            style={{ left: config.autoExportEnabled ? '22px' : '2px' }}
          />
        </button>
      </div>

      {config.autoExportEnabled && (
        <div>
          <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Interval (minutes)</label>
          <select
            value={config.autoExportInterval}
            onChange={(e) => updateConfig({ autoExportInterval: Number(e.target.value) })}
            className="input-sakura text-sm"
          >
            {[30, 60, 120, 360].map((m) => (
              <option key={m} value={m}>Every {m >= 60 ? m / 60 + 'h' : m + 'm'}</option>
            ))}
          </select>
        </div>
      )}

      <button onClick={handleExport} disabled={isExporting} className="btn-sakura btn-primary btn-sm">
        {isExporting ? 'Exporting...' : '📥 Export All as Markdown ZIP'}
      </button>

      {config.lastExportAt && (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Last export: {new Date(config.lastExportAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ── Backup Tab ──
function BackupTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState('');

  const handleExport = async () => {
    await exportFullBackupJSON();
    setMsg('Backup downloaded!');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('This will replace ALL existing data. Continue?')) return;
    setImporting(true);
    try {
      await importFullBackupJSON(file);
      setMsg('Backup restored! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMsg('Failed to import. Check file format.');
    }
    setImporting(false);
  };

  return (
    <div className="card-static max-w-md space-y-4">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Backup & Restore</h3>

      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Export all your data (priorities, tasks, snippets, STAR entries, etc.) as a JSON file for backup or transfer.
      </p>

      <button onClick={handleExport} className="btn-sakura btn-primary btn-sm">📦 Export Full Backup (JSON)</button>

      <hr style={{ borderColor: 'var(--border-color)' }} />

      <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Restore from Backup</h4>
      <p className="text-xs" style={{ color: 'var(--danger)' }}>⚠ This will replace all current data.</p>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="text-sm"
        disabled={importing}
      />
      {importing && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Importing...</p>}
      {msg && <p className="text-xs" style={{ color: msg.includes('Failed') ? 'var(--danger)' : 'var(--success)' }}>{msg}</p>}
    </div>
  );
}

// ── Cloud Tab (Firebase) ──
function CloudTab() {
  const [config, setConfig] = useState<FirebaseConfig>(getFirebaseConfig() || {
    apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '',
  });
  const [status, setStatus] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<{ local: number; remote: number } | null>(null);

  const connected = isFirebaseConfigured();

  useEffect(() => {
    if (connected) getCloudStats().then(setStats);
  }, []);

  const handleConnect = () => {
    if (!config.apiKey || !config.projectId) {
      setStatus('API Key and Project ID are required');
      return;
    }
    configureFirebase(config);
    setStatus('Connected!');
    getCloudStats().then(setStats);
  };

  const handlePush = async () => {
    setSyncing(true); setStatus('');
    try {
      const results = await pushAllToCloud();
      const total = Object.values(results).reduce((a, b) => a + b, 0);
      setStatus(`Pushed ${total} records to cloud`);
      getCloudStats().then(setStats);
    } catch (e: any) {
      setStatus(`Push failed: ${e.message}`);
    }
    setSyncing(false);
  };

  const handlePull = async () => {
    if (!confirm('This will REPLACE all local data with cloud data. Continue?')) return;
    setSyncing(true); setStatus('');
    try {
      const results = await pullAllFromCloud();
      const total = Object.values(results).reduce((a, b) => a + b, 0);
      setStatus(`Pulled ${total} records from cloud. Reloading...`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setStatus(`Pull failed: ${e.message}`);
    }
    setSyncing(false);
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect Firebase? Your local data is preserved.')) {
      clearFirebaseConfig();
      setStatus('Disconnected');
      setStats(null);
    }
  };

  return (
    <div className="card-static max-w-lg space-y-4">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>☁️ Firebase Cloud Sync</h3>

      {connected ? (
        <div className="p-3 rounded-lg space-y-3" style={{ background: '#E2EDE4' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--success)' }}>✅ Connected to Firebase</p>
          {stats && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              📊 {stats.local} local records · {stats.remote} cloud records
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handlePush} disabled={syncing} className="btn-sakura btn-primary btn-sm">
              {syncing ? 'Syncing...' : '📤 Push to Cloud'}
            </button>
            <button onClick={handlePull} disabled={syncing} className="btn-sakura btn-secondary btn-sm">
              {syncing ? 'Syncing...' : '📥 Pull from Cloud'}
            </button>
            <button onClick={handleDisconnect} className="btn-sakura btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
              Disconnect
            </button>
          </div>
          {status && <p className="text-xs" style={{ color: status.includes('Failed') ? 'var(--danger)' : 'var(--text-primary)' }}>{status}</p>}
        </div>
      ) : (
        <>
          <div className="p-3 rounded-lg space-y-2 text-xs" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>📋 Setup steps:</p>
            <ol className="space-y-1" style={{ paddingLeft: 16 }}>
              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Firebase Console</a> → Create Project</li>
              <li>Build → Firestore Database → Create (production mode)</li>
              <li>Project Settings → General → Web App → Register</li>
              <li>Copy the Firebase config object below</li>
            </ol>
          </div>

          <div className="space-y-2">
            <input value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} placeholder="apiKey" className="input-sakura text-xs font-mono" />
            <input value={config.authDomain} onChange={(e) => setConfig({ ...config, authDomain: e.target.value })} placeholder="authDomain" className="input-sakura text-xs font-mono" />
            <input value={config.projectId} onChange={(e) => setConfig({ ...config, projectId: e.target.value })} placeholder="projectId" className="input-sakura text-xs font-mono" />
            <input value={config.storageBucket} onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })} placeholder="storageBucket" className="input-sakura text-xs font-mono" />
            <input value={config.messagingSenderId} onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })} placeholder="messagingSenderId" className="input-sakura text-xs font-mono" />
            <input value={config.appId} onChange={(e) => setConfig({ ...config, appId: e.target.value })} placeholder="appId" className="input-sakura text-xs font-mono" />
          </div>

          <button onClick={handleConnect} className="btn-sakura btn-primary btn-sm">Connect</button>
        </>
      )}

      {status && !connected && <p className="text-xs" style={{ color: 'var(--danger)' }}>{status}</p>}
    </div>
  );
}

// ── Calendar Tab (Google Calendar ICS) ──
function CalendarTab() {
  const { icsUrl, events, loading, error, lastFetched, setIcsUrl, loadFromStorage, refresh } = useGCalStore();
  const [url, setUrl] = useState(icsUrl);

  useEffect(() => { loadFromStorage(); }, []);
  useEffect(() => { setUrl(icsUrl); }, [icsUrl]);

  const handleSave = () => {
    setIcsUrl(url.trim());
    if (url.trim()) refresh();
  };

  return (
    <div className="card-static max-w-lg space-y-4">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Google Calendar Sync</h3>

      <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-subtle)' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          📋 How to get your ICS link:
        </p>
        <ol className="text-xs space-y-1" style={{ color: 'var(--text-secondary)', paddingLeft: 16 }}>
          <li>Open <a href="https://calendar.google.com/calendar/u/0/settings" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Google Calendar Settings</a></li>
          <li>Click your calendar under "Settings for my calendars"</li>
          <li>Scroll to <strong>"Secret address in iCal format"</strong></li>
          <li>Copy the URL and paste it below</li>
        </ol>
      </div>

      <div>
        <label className="text-[10px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>Secret iCal URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://calendar.google.com/calendar/ical/..."
          className="input-sakura text-sm font-mono"
        />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleSave} className="btn-sakura btn-primary btn-sm">Save & Fetch</button>
        <button onClick={refresh} className="btn-sakura btn-secondary btn-sm" disabled={!icsUrl}>
          Refresh Events
        </button>
      </div>

      {loading && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Fetching calendar events...</p>}
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
      {lastFetched && !loading && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--success)' }}>
            ✅ {events.length} events loaded · Last synced: {new Date(lastFetched).toLocaleTimeString()}
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {events.slice(0, 5).map((e) => (
              <div key={e.uid} className="text-xs flex items-center gap-2 py-1" style={{ color: 'var(--text-secondary)' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#4285F4' }} />
                <span className="truncate">{e.title}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{new Date(e.start).toLocaleDateString()}</span>
              </div>
            ))}
            {events.length > 5 && (
              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>+{events.length - 5} more events</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
