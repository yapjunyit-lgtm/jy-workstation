import { useState, useRef } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSyncStore } from '../stores/useSyncStore';
import { exportAllAsMarkdownZip, exportFullBackupJSON, importFullBackupJSON } from '../lib/sync';

type SettingsTab = 'auth' | 'sync' | 'backup';

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('auth');

  return (
    <div className="page-enter space-y-6">
      <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>⚙️ Settings</h2>

      <div className="flex items-center gap-1 border-b pb-0" style={{ borderColor: 'var(--border-color)' }}>
        {([
          { id: 'auth' as const, label: 'Auth' },
          { id: 'sync' as const, label: 'Sync' },
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
