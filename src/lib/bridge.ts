/**
 * Client for the local vault bridge server (server/vault-bridge.mjs).
 * The bridge runs on this laptop and talks to the Obsidian vault + Codex CLI.
 */

export const BRIDGE_URL =
  (import.meta.env.VITE_BRIDGE_URL as string | undefined) ?? 'http://127.0.0.1:4788';

export interface LedgerEntry {
  ts: string;
  action: string;
  prompt?: string;
  status: 'ok' | 'error';
  exitCode?: number;
  commit?: string | null;
  message?: string;
}

export interface VaultStatus {
  date: string;
  vault: string;
  repoOk: boolean;
  branch: string;
  lastCommit: { hash: string; subject: string } | null;
  commits: { hash: string; subject: string }[];
  dirty: { count: number; files: string[] };
  todayNote: { exists: boolean; path: string };
  ledger: LedgerEntry[];
  codex: { ok: boolean; node: string; cli: string };
  actions: { id: string; label: string; kind: string }[];
}

export interface BridgeEvent {
  type: 'start' | 'output' | 'done' | 'error';
  action?: string;
  label?: string;
  startedAt?: string;
  stream?: 'stdout' | 'stderr';
  line?: string;
  ok?: boolean;
  exitCode?: number;
  commit?: string | null;
  durationMs?: number;
  lastMessage?: string;
  message?: string;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BRIDGE_URL}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Bridge error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function health(): Promise<{ ok: boolean; service: string; vault: string; codex: boolean }> {
  return fetchJson('/api/health');
}

export function getStatus(): Promise<VaultStatus> {
  return fetchJson('/api/vault/status');
}

export function getLedger(limit = 20): Promise<{ entries: LedgerEntry[] }> {
  return fetchJson(`/api/vault/ledger?limit=${limit}`);
}

export interface RunOptions {
  prompt?: string;
  project?: string;
  onEvent?: (event: BridgeEvent) => void;
}

export async function runAction(action: string, opts: RunOptions = {}): Promise<BridgeEvent> {
  const res = await fetch(`${BRIDGE_URL}/api/vault/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, prompt: opts.prompt, project: opts.project }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Bridge error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let final: BridgeEvent = { type: 'done', ok: false };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!dataLine) continue;
      try {
        const event = JSON.parse(dataLine.slice(6)) as BridgeEvent;
        opts.onEvent?.(event);
        if (event.type === 'done' || event.type === 'error') final = event;
      } catch {
        /* skip malformed event */
      }
    }
  }

  return final;
}
