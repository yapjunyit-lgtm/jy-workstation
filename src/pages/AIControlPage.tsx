import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Bot, Play, RefreshCw, Terminal, FilePlus2, HeartPulse, ClipboardList,
  Trash2, ExternalLink, Loader2, Clock, GitCommitHorizontal,
} from 'lucide-react';
import {
  BRIDGE_URL, getStatus, runAction, type BridgeEvent, type VaultStatus, type LedgerEntry,
} from '../lib/bridge';
import { ObsidianURI } from '../lib/obsidian-uri';
import { AIAssistantPanel } from '../components/ai/AIAssistantPanel';

const VAULT_NAME = 'JY_Vault';

interface ConsoleLine {
  stream: 'stdout' | 'stderr' | 'info';
  text: string;
}

export function AIControlPage() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'assistant' | 'vault'>('assistant');
  const [running, setRunning] = useState<string | null>(null);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [done, setDone] = useState<BridgeEvent | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [project, setProject] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState('');
  const consoleRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [st, lg] = await Promise.all([getStatus(), fetch(`${BRIDGE_URL}/api/vault/ledger?limit=20`).then((r) => r.json())]);
      setStatus(st);
      setLedger(lg.entries ?? []);
      setBridgeOk(true);
      setError('');
    } catch {
      setBridgeOk(false);
      setError('Cannot reach the vault bridge. Start it with: npm run bridge');
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      if (!running) refresh();
    }, 15000);
    return () => clearInterval(t);
  }, [refresh, running]);

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  const handleAction = async (action: string, opts: { project?: string; prompt?: string } = {}) => {
    if (running) return;
    setRunning(action);
    setLines([{ stream: 'info', text: `▶ ${action} started — ${new Date().toLocaleTimeString()}` }]);
    setDone(null);
    setError('');
    try {
      const final = await runAction(action, {
        project: opts.project,
        prompt: opts.prompt,
        onEvent: (e) => {
          if (e.type === 'output' && e.line) {
            const text = e.line;
            const stream = e.stream === 'stderr' ? 'stderr' : 'stdout';
            setLines((prev) => [...prev, { stream, text }]);
          }
          if (e.type === 'error' && e.message) {
            const text = e.message;
            setLines((prev) => [...prev, { stream: 'stderr', text }]);
          }
        },
      });
      setDone(final);
      setLines((prev) => [...prev, {
        stream: 'info',
        text: final.ok
          ? `✓ finished in ${((final.durationMs ?? 0) / 1000).toFixed(1)}s${final.commit ? ` · commit ${final.commit}` : ''}`
          : `✗ failed (exit ${final.exitCode ?? '?'})`,
      }]);
      if (opts.project) setProject('');
      if (opts.prompt) setCustomPrompt('');
      refresh();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setLines((prev) => [...prev, { stream: 'stderr', text: String(err instanceof Error ? err.message : err) }]);
      setRunning(null);
    }
  };

  const runningLabel = status?.actions.find((a) => a.id === running)?.label ?? running;

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>🤖 AI Assistant</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Insights about your workstation + make changes — powered by Codex via your local bridge.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${bridgeOk ? 'badge-success' : bridgeOk === null ? 'badge-neutral' : 'badge-danger'}`}>
            {bridgeOk ? 'Bridge connected' : bridgeOk === null ? 'Connecting…' : 'Bridge offline'}
          </span>
          <button className="btn-sakura btn-secondary btn-sm" onClick={refresh} disabled={!!running}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="card-static" style={{ borderColor: 'var(--danger)', background: '#F3E4E0' }}>
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            In the JY_Workstation repo: <code>npm run bridge</code> — then reload this page.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b pb-0" style={{ borderColor: 'var(--border-color)' }}>
        {([
          { id: 'assistant' as const, label: '💬 Assistant' },
          { id: 'vault' as const, label: '🗂️ Vault Control' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-sm transition-soft border-b-2 -mb-px"
            style={{
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderColor: tab === t.id ? 'var(--accent)' : 'transparent',
              fontWeight: tab === t.id ? 500 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assistant' && <AIAssistantPanel />}

      {tab === 'vault' && (
        <>
      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          icon={<GitCommitHorizontal size={16} />}
          label="Repository"
          value={status ? `${status.branch} · ${status.commits.length} commits` : '—'}
          sub={status?.lastCommit ? `${status.lastCommit.hash.slice(0, 7)} ${status.lastCommit.subject}` : ''}
        />
        <StatusCard
          icon={<Clock size={16} />}
          label="Working tree"
          value={status ? `${status.dirty.count} uncommitted` : '—'}
          sub={status?.dirty.files[0] ?? (status?.dirty.count ? '…' : 'clean')}
        />
        <StatusCard
          icon={<FilePlus2 size={16} />}
          label="Today's note"
          value={status ? (status.todayNote.exists ? 'Exists' : 'Missing') : '—'}
          sub={status?.todayNote.path ?? ''}
          accent={status?.todayNote.exists ? 'success' : 'warning'}
        />
        <StatusCard
          icon={<Bot size={16} />}
          label="Codex CLI"
          value={status ? (status.codex.ok ? 'Ready' : 'Missing') : '—'}
          sub={status?.codex.ok ? 'deepseek-v4-flash' : 'check bridge env'}
          accent={status?.codex.ok ? 'success' : 'danger'}
        />
      </div>

      {/* Actions */}
      <div className="card-static space-y-4">
        <div className="flex items-center gap-2">
          <Terminal size={16} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-medium">Automations</h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionButton
            icon={<FilePlus2 size={15} />}
            label="Create Today Note"
            running={running === 'create-today'}
            disabled={!!running}
            onClick={() => handleAction('create-today')}
          />
          <ActionButton
            icon={<ClipboardList size={15} />}
            label="Process Inbox"
            running={running === 'process-inbox'}
            disabled={!!running}
            onClick={() => handleAction('process-inbox')}
          />
          <ActionButton
            icon={<HeartPulse size={15} />}
            label="Health Check (体检)"
            running={running === 'health-check'}
            disabled={!!running}
            onClick={() => handleAction('health-check')}
          />
          <button
            className="btn-sakura btn-secondary"
            disabled={!!running || !project.trim()}
            onClick={() => handleAction('log-work', { project: project.trim() })}
            title="Log today's work for a project"
          >
            {running === 'log-work' ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Log Work
          </button>
        </div>

        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
          <input
            className="input-sakura"
            placeholder="Project name for work log (e.g. GroSteady, Internship)"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            disabled={!!running}
          />
          <input
            className="input-sakura"
            placeholder="Or type a custom prompt for Codex…"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={!!running}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customPrompt.trim() && !running) {
                handleAction('custom', { prompt: customPrompt.trim() });
              }
            }}
          />
          <button
            className="btn-sakura btn-primary"
            disabled={!!running || !customPrompt.trim()}
            onClick={() => handleAction('custom', { prompt: customPrompt.trim() })}
          >
            {running === 'custom' ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Run
          </button>
        </div>

        {running && (
          <p className="text-xs" style={{ color: 'var(--info)' }}>
            <Loader2 size={12} className="inline animate-spin mr-1" />
            Running: {runningLabel} — watch the console below.
          </p>
        )}
      </div>

      {/* Console */}
      <div className="card-static space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={15} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-medium">Console</h3>
          </div>
          <div className="flex items-center gap-2">
            {done && done.ok && <span className="badge badge-success">OK</span>}
            {done && !done.ok && <span className="badge badge-danger">Failed</span>}
            <button className="btn-sakura btn-ghost btn-sm" onClick={() => setLines([])}>
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        <div
          ref={consoleRef}
          className="overflow-y-auto rounded-lg p-3 font-mono text-xs leading-relaxed"
          style={{
            height: 240,
            background: '#2B2926',
            color: '#E8E4DD',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {lines.length === 0 && (
            <span style={{ color: '#8B8680' }}>
              Console idle. Pick an automation above — output streams here live.
            </span>
          )}
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                color: l.stream === 'stderr' ? '#E5A69A' : l.stream === 'info' ? '#C9C4BB' : '#E8E4DD',
              }}
            >
              {l.text}
            </div>
          ))}
        </div>
      </div>

      {/* Ledger */}
      <div className="card-static space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={15} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-medium">Action Ledger (last 20)</h3>
          </div>
          <a
            className="btn-sakura btn-ghost btn-sm"
            href="obsidian://open?vault=JY_Vault&file=JY_Workstation%2F_logs%2Factions"
          >
            <ExternalLink size={13} /> View in vault
          </a>
        </div>

        {ledger.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No actions yet. Every automation you run lands here with a git commit hash.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left font-normal py-2 pr-3">Time</th>
                  <th className="text-left font-normal py-2 pr-3">Action</th>
                  <th className="text-left font-normal py-2 pr-3">Status</th>
                  <th className="text-left font-normal py-2 pr-3">Commit</th>
                  <th className="text-left font-normal py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 pr-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {new Date(entry.ts).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3">{entry.action}</td>
                    <td className="py-2 pr-3">
                      <span className={`badge ${entry.status === 'ok' ? 'badge-success' : 'badge-danger'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {entry.commit ? entry.commit.slice(0, 7) : '—'}
                    </td>
                    <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                      {(entry.message ?? '').split('\n')[0].slice(0, 80) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <button className="btn-sakura btn-secondary" onClick={() => ObsidianURI.openNote(VAULT_NAME, 'Dashboard')}>
          <ExternalLink size={14} /> Open Dashboard
        </button>
        <button
          className="btn-sakura btn-secondary"
          onClick={() => status && ObsidianURI.openNote(VAULT_NAME, `10-Daily/${status.date}`)}
          disabled={!status}
        >
          <ExternalLink size={14} /> Open Today's Note
        </button>
        <a className="btn-sakura btn-ghost" href="obsidian://open?vault=JY_Vault" target="_blank" rel="noreferrer">
          <ExternalLink size={14} /> Open Vault
        </a>
      </div>
        </>
      )}
    </div>
  );
}

function StatusCard(props: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: 'success' | 'warning' | 'danger';
}) {
  const dotColor =
    props.accent === 'success' ? 'var(--success)' :
    props.accent === 'warning' ? 'var(--warning)' :
    props.accent === 'danger' ? 'var(--danger)' : 'var(--text-tertiary)';
  return (
    <div className="card-static">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: 'var(--accent)' }}>{props.icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {props.label}
        </span>
        <span className="ml-auto" style={{ width: 8, height: 8, borderRadius: 999, background: dotColor }} />
      </div>
      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{props.value}</div>
      {props.sub && (
        <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{props.sub}</div>
      )}
    </div>
  );
}

function ActionButton(props: {
  icon: ReactNode;
  label: string;
  running: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="btn-sakura btn-secondary"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.running ? <Loader2 size={15} className="animate-spin" /> : props.icon}
      {props.label}
    </button>
  );
}
