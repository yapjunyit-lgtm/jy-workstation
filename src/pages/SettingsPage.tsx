import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSyncStore } from '../stores/useSyncStore';
import { useGCalStore } from '../stores/useGCalStore';
import { exportAllAsMarkdownZip, exportFullBackupJSON, importFullBackupJSON } from '../lib/sync';
import { isBridgeReachable } from '../lib/cloud-sync';
import { pushAllToCloud, pullAllFromCloud, getCloudStats } from '../lib/cloud-sync';
import { PageHeader } from '../components/layout/PageHeader';
import { PillTabs } from '../components/layout/PillTabs';
import { formatDateTimeIntl, formatTimeIntl, formatDateIntl } from '../lib/utils';

type SettingsTab = 'auth' | 'sync' | 'calendar' | 'cloud' | 'backup';

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('auth');

  return (
    <div className="page-enter space-y-6">
      <PageHeader eyebrow="Configuration" title="Workstation " accent="settings" />

      <PillTabs
        tabs={[
          { id: 'auth' as const, label: 'Auth' },
          { id: 'sync' as const, label: 'Obsidian' },
          { id: 'calendar' as const, label: 'Calendar' },
          { id: 'cloud' as const, label: 'Local Sync' },
          { id: 'backup' as const, label: 'Backup' },
        ]}
        value={tab}
        onChange={setTab}
      />

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
      <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="Current passphrase" className="input-sakura text-sm" aria-label="Current passphrase" />
      <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New passphrase (min 8 chars)" className="input-sakura text-sm" aria-label="New passphrase" />
      <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new passphrase" className="input-sakura text-sm" aria-label="Confirm new passphrase" />
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
          role="switch"
          aria-checked={config.autoExportEnabled}
          aria-label="Toggle auto-export"
          className="w-10 h-5 rounded-full relative transition-soft"
          style={{ background: config.autoExportEnabled ? 'var(--accent)' : 'var(--border-color)' }}
        >
          <div
            className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm"
            style={{ left: 2, transform: config.autoExportEnabled ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 200ms var(--ease-out-quint)' }}
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
        {isExporting ? 'Exporting…' : 'Export All as Markdown ZIP'}
      </button>

      {config.lastExportAt && (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Last export: {formatDateTimeIntl(config.lastExportAt)}
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
      setMsg('Backup restored! Reloading…');
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

      <button onClick={handleExport} className="btn-sakura btn-primary btn-sm">Export Full Backup (JSON)</button>

      <hr style={{ borderColor: 'var(--border-color)' }} />

      <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Restore from Backup</h4>
      <p className="text-xs" style={{ color: 'var(--danger)' }}>This will replace all current data.</p>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="text-sm"
        disabled={importing}
        aria-label="Backup JSON file"
      />
      {importing && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Importing…</p>}
      {msg && <p className="text-xs" style={{ color: msg.includes('Failed') ? 'var(--danger)' : 'var(--success)' }}>{msg}</p>}
    </div>
  );
}

// ── Cloud Tab (Firebase) ──
function CloudTab() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [status, setStatus] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<{ local: number; remote: number } | null>(null);

  const refresh = async () => {
    const ok = await isBridgeReachable();
    setConnected(ok);
    if (ok) getCloudStats().then(setStats);
    else setStats(null);
  };

  useEffect(() => { refresh(); }, []);

  const handlePush = async () => {
    setSyncing(true); setStatus('');
    try {
      const results = await pushAllToCloud();
      const total = Object.values(results).reduce((a, b) => a + b, 0);
      setStatus(`Pushed ${total} records to local database`);
      getCloudStats().then(setStats);
    } catch (e: any) {
      setStatus(`Push failed: ${e.message}`);
    }
    setSyncing(false);
  };

  const handlePull = async () => {
    if (!confirm('This will REPLACE all local data with database data. Continue?')) return;
    setSyncing(true); setStatus('');
    try {
      const results = await pullAllFromCloud({ prune: true });
      const total = Object.values(results).reduce((a, b) => a + b, 0);
      setStatus(`Pulled ${total} records from local database. Reloading…`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setStatus(`Pull failed: ${e.message}`);
    }
    setSyncing(false);
  };

  return (
    <div className="card-static max-w-lg space-y-4">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>💾 Local Database Sync</h3>

      {connected === null ? (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Checking bridge…</p>
      ) : connected ? (
        <div className="p-3 rounded-lg space-y-3" style={{ background: '#E2EDE4' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--success)' }}>Connected to local SQLite (vault bridge)</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Data is stored on this machine at <code className="font-mono">server/workspace.db</code> — every browser
            hitting the bridge shares it. No cloud, no quota, no sign-in.
          </p>
          {stats && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {stats.local} local records · {stats.remote} database records
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handlePush} disabled={syncing} className="btn-sakura btn-primary btn-sm">
              {syncing ? 'Syncing…' : 'Push to Database'}
            </button>
            <button onClick={handlePull} disabled={syncing} className="btn-sakura btn-secondary btn-sm">
              {syncing ? 'Syncing…' : 'Pull from Database'}
            </button>
            <button onClick={() => refresh()} className="btn-sakura btn-ghost btn-sm">Refresh</button>
          </div>
          {status && <p className="text-xs" style={{ color: status.includes('Failed') ? 'var(--danger)' : 'var(--text-primary)' }}>{status}</p>}
        </div>
      ) : (
        <div className="p-3 rounded-lg space-y-2 text-xs" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Bridge not reachable</p>
          <p>Start the local vault bridge to enable sync between browsers:</p>
          <pre className="font-mono p-2 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>npm run bridge</pre>
          <p>(It normally runs automatically via launchd — see <code className="font-mono">com.jy.vault-bridge</code>.)</p>
          <button onClick={() => refresh()} className="btn-sakura btn-primary btn-sm">Retry</button>
        </div>
      )}
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
          How to get your ICS link:
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
          placeholder="https://calendar.google.com/calendar/ical/…"
          className="input-sakura text-sm font-mono"
        />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleSave} className="btn-sakura btn-primary btn-sm">Save & Fetch</button>
        <button onClick={refresh} className="btn-sakura btn-secondary btn-sm" disabled={!icsUrl}>
          Refresh Events
        </button>
      </div>

      {loading && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Fetching calendar events…</p>}
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
      {lastFetched && !loading && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--success)' }}>
            {events.length} events loaded · Last synced: {formatTimeIntl(lastFetched)}
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {events.slice(0, 5).map((e) => (
              <div key={e.uid} className="text-xs flex items-center gap-2 py-1" style={{ color: 'var(--text-secondary)' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#4285F4' }} />
                <span className="truncate">{e.title}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{formatDateIntl(new Date(e.start).getTime())}</span>
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
