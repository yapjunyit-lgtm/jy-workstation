/**
 * Local Sync Engine — bridges Dexie (IndexedDB) to the local vault bridge's
 * SQLite database (server/workspace.db). No cloud, no auth, no quota.
 *
 * - Local (Dexie) is the read/write store; every change is pushed to the
 *   bridge (debounced) and bridge changes are polled back in real time.
 * - Deletes become `{ deleted: true, updatedAt }` tombstones so they
 *   propagate to every browser hitting the same bridge.
 */
import { db } from './db';
import { notifyStoreRefresh } from './store-refresh';
import { BRIDGE_URL, health } from './bridge';

export const SYNC_TABLES = [
  'priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources',
  'checklistItems', 'starEntries', 'sopDocuments', 'timeBlocks',
  'scratchNotes', 'quickNotes', 'aiConversations', 'syncConfig', 'appSettings',
] as const;

export type SyncTableName = (typeof SYNC_TABLES)[number];
type CountMap = Record<string, number>;

function dataUrl(collection: string): string {
  return `${BRIDGE_URL}/api/data/${collection}`;
}

// ── Push: local → bridge SQLite ───────────────────────────────────────
// Per-session cache of the last JSON pushed per record → unchanged docs
// are never rewritten.
const lastPushedJson = new Map<string, Map<string, string>>();

async function pushTable(table: SyncTableName): Promise<number> {
  const records = await db.table(table).toArray() as Record<string, unknown>[];
  let cache = lastPushedJson.get(table);
  if (!cache) {
    cache = new Map();
    lastPushedJson.set(table, cache);
  }

  const payload: Record<string, unknown>[] = [];
  for (const rec of records) {
    const id = rec.id as string;
    const { id: _id, ...rest } = rec;
    const full = { ...rest, updatedAt: rec.updatedAt ?? Date.now() };
    const json = JSON.stringify(full);
    if (cache.get(id) === json) continue; // unchanged since last push
    payload.push({ id, ...full });
    cache.set(id, json);
  }

  if (payload.length === 0) return 0;
  const res = await fetch(dataUrl(table), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: payload }),
  });
  if (!res.ok) throw new Error(`Bridge push failed: ${res.status}`);
  const data = await res.json();
  return data.count ?? payload.length;
}

export async function pushAllToCloud(): Promise<CountMap> {
  const results: CountMap = {};
  for (const table of SYNC_TABLES) {
    try {
      results[table] = await pushTable(table);
    } catch (e) {
      results[table] = 0;
      console.warn(`[sync] push ${table} failed`, e);
    }
  }
  return results;
}

// ── Pull: bridge → local ──────────────────────────────────────────────
// Automatic sync never prunes local-only records — a record that exists
// locally but not on the bridge is a pending local write, not a deletion.
// The manual "Pull from Database" action in Settings opts in to pruning so
// it keeps its documented "replace all local data" behavior.
export async function pullAllFromCloud(opts: { prune?: boolean } = {}): Promise<CountMap> {
  const { prune = false } = opts;
  const results: CountMap = {};
  for (const table of SYNC_TABLES) {
    try {
      const res = await fetch(dataUrl(table));
      if (!res.ok) continue;
      const { records = [] } = await res.json();
      if (records.length === 0) {
        results[table] = 0; // bridge empty — keep local
        continue;
      }
      for (const rec of records) {
        await db.table(table).put(rec as never);
      }
      if (prune) {
        // Explicit replace: drop local rows absent from the bridge.
        const cloudIds = new Set<string>(records.map((r: { id: unknown }) => r.id as string));
        const local = await db.table(table).toArray() as { id: string }[];
        for (const rec of local) {
          if (!cloudIds.has(rec.id)) await db.table(table).delete(rec.id);
        }
      }
      results[table] = records.length;
      notifyStoreRefresh(table);
    } catch (e) {
      results[table] = 0;
    }
  }
  return results;
}

// ── Stats ─────────────────────────────────────────────────────────────
export async function getCloudStats(): Promise<{ local: number; remote: number }> {
  let local = 0;
  for (const table of SYNC_TABLES) {
    try { local += await db.table(table).count(); } catch { /* ignore */ }
  }
  let remote = 0;
  try {
    const res = await fetch(`${BRIDGE_URL}/api/data/stats`);
    if (res.ok) {
      const stats = await res.json();
      remote = stats.total ?? 0;
    }
  } catch { /* bridge offline */ }
  return { local, remote };
}

// ── Realtime: poll bridge changes → local ─────────────────────────────
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastChangeTs = 0;

export async function startRealtimeSync(): Promise<void> {
  stopRealtimeSync();
  lastChangeTs = 0;
  await applyChanges();
  pollTimer = setInterval(() => { applyChanges().catch(() => {}); }, 3000);
}

export function stopRealtimeSync(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function applyChanges(): Promise<void> {
  const res = await fetch(`${BRIDGE_URL}/api/data/changes?since=${lastChangeTs}`);
  if (!res.ok) return;
  const { changes = [] } = await res.json();
  if (changes.length === 0) return;

  const touched = new Set<string>();
  for (const ch of changes) {
    const table = ch.collection as SyncTableName;
    if (!SYNC_TABLES.includes(table)) continue;
    const localTable = db.table(table);
    if (ch.deleted) {
      await localTable.delete(ch.id).catch(() => {});
    } else {
      const existing = await localTable.get(ch.id).catch(() => undefined);
      if (existing) {
        const ex = existing as Record<string, unknown>;
        if ((ex.updatedAt ?? 0) > (ch.updatedAt ?? 0)) continue; // local newer
        // Echo guard: identical data must not rewrite local
        if ((ex.updatedAt ?? 0) === (ch.updatedAt ?? 0)) {
          const exJson = JSON.stringify(ex);
          const inJson = JSON.stringify({ ...ch.data, id: ch.id, updatedAt: ch.updatedAt });
          if (exJson === inJson) continue;
        }
      }
      await localTable.put({ ...ch.data, id: ch.id, updatedAt: ch.updatedAt } as never).catch(() => {});
    }
    touched.add(table);
  }
  lastChangeTs = changes[changes.length - 1].updatedAt;
  touched.forEach((t) => notifyStoreRefresh(t));
}

// ── Auto-push on local changes (debounced) ────────────────────────────
let hooksAttached = false;
const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleTablePush(table: string): void {
  const timer = pushTimers.get(table);
  if (timer) clearTimeout(timer);
  pushTimers.set(table, setTimeout(async () => {
    pushTimers.delete(table);
    try { await pushTable(table as SyncTableName); } catch { /* retry on next change */ }
  }, 800));
}

function tombstone(table: string, id: string): void {
  fetch(dataUrl(table), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ id, deleted: true, updatedAt: Date.now() }] }),
  }).catch(() => {});
}

export function attachAutoPush(): void {
  if (hooksAttached) return;
  hooksAttached = true;

  for (const table of SYNC_TABLES) {
    const t = db.table(table) as never as {
      hook(name: string, fn: (...args: any[]) => void): void;
    };
    t.hook('creating', (...args: any[]) => {
      scheduleTablePush(table);
      void args;
    });
    t.hook('updating', (...args: any[]) => {
      scheduleTablePush(table);
      void args;
    });
    t.hook('deleting', (...args: any[]) => {
      const primKey = args[0];
      const obj = args[1] as { id?: string } | undefined;
      const id = (obj?.id ?? primKey) as string;
      scheduleTablePush(table);
      tombstone(table, id);
    });
  }
}

// ── One-shot full sync ────────────────────────────────────────────────
export async function syncNow(): Promise<CountMap> {
  const pushed = await pushAllToCloud();
  const pulled = await pullAllFromCloud();
  return { ...pulled, ...pushed };
}

export async function isBridgeReachable(): Promise<boolean> {
  try {
    const h = await health();
    return h.ok === true;
  } catch {
    return false;
  }
}
