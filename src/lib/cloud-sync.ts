/**
 * Cloud Sync Engine — bridges local Dexie (IndexedDB) to Firestore.
 *
 * - Local (Dexie) is the read/write store; every change is pushed to
 *   Firestore (debounced) and remote changes are mirrored back in real time.
 * - Deletes become `{ deleted: true, updatedAt }` tombstones so they
 *   propagate to other devices.
 * - Data lives under `users/{uid}/{collection}` so each account owns
 *   its own cloud copy (anonymous accounts are per-device; use
 *   email/password for multi-device access).
 */
import { db } from './db';
import { notifyStoreRefresh } from './store-refresh';
import {
  getFirestoreDB, getFirebaseAuth, isFirebaseConfigured,
} from './firebase';
import {
  collection, doc, getDocs, setDoc, onSnapshot,
  query, limit, type Unsubscribe,
} from 'firebase/firestore';

function isDocumentVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}

export const SYNC_TABLES = [
  'priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources',
  'checklistItems', 'starEntries', 'sopDocuments', 'timeBlocks',
  'scratchNotes', 'syncConfig', 'appSettings',
] as const;

export type SyncTableName = (typeof SYNC_TABLES)[number];
type CountMap = Record<string, number>;


function userPath(table: string): string {
  const auth = getFirebaseAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return `users/${uid}/${table}`;
}

// ── Push: local → cloud ───────────────────────────────────────────────
export async function pushAllToCloud(): Promise<CountMap> {
  const results: CountMap = {};
  if (!isFirebaseConfigured()) return results;
  if (!isDocumentVisible()) return results; // skip while tab is hidden
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return results;     // only sync when signed in
  const firestore = getFirestoreDB();

  for (const table of SYNC_TABLES) {
    try {
      const records = await db.table(table).toArray() as Record<string, unknown>[];
      const col = collection(firestore, userPath(table));
      for (const rec of records) {
        const id = rec.id as string;
        const { id: _id, ...rest } = rec;
        await setDoc(doc(col, id), { ...rest, updatedAt: rec.updatedAt ?? Date.now() });
      }
      results[table] = records.length;
    } catch {
      results[table] = 0; // keep going, report per-table
    }
  }
  return results;
}

// ── Pull: cloud → local (replaces local with cloud when cloud has data) ─
export async function pullAllFromCloud(): Promise<CountMap> {
  const results: CountMap = {};
  if (!isFirebaseConfigured()) return results;
  if (!isDocumentVisible()) return results;
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return results;
  const firestore = getFirestoreDB();

  for (const table of SYNC_TABLES) {
    try {
      const col = collection(firestore, userPath(table));
      const snap = await getDocs(query(col, limit(5000)));
      if (snap.empty) {
        results[table] = 0; // cloud is empty — keep local data
        continue;
      }
      const cloudIds = new Set<string>();
      for (const d of snap.docs) {
        const data = d.data();
        if (data.deleted) continue;
        cloudIds.add(d.id);
        await db.table(table).put({ ...data, id: d.id } as never);
      }
      // Remove local records that no longer exist in the cloud
      const local = await db.table(table).toArray() as { id: string }[];
      for (const rec of local) {
        if (!cloudIds.has(rec.id)) await db.table(table).delete(rec.id);
      }
      results[table] = cloudIds.size;
      notifyStoreRefresh(table); // cloud data changed → stores must re-read
    } catch {
      results[table] = 0;
    }
  }
  return results;
}

// ── Stats ─────────────────────────────────────────────────────────────
export async function getCloudStats(): Promise<{ local: number; remote: number }> {
  let local = 0;
  let remote = 0;
  if (!isFirebaseConfigured()) return { local, remote };

  for (const table of SYNC_TABLES) {
    try { local += await db.table(table).count(); } catch { /* ignore */ }
  }

  if (!isDocumentVisible()) return { local, remote };
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    const firestore = getFirestoreDB();
    for (const table of SYNC_TABLES) {
      try {
        const col = collection(firestore, userPath(table));
        const snap = await getDocs(query(col, limit(5000)));
        remote += snap.size;
      } catch { /* ignore */ }
    }
  }

  return { local, remote };
}

// ── Real-time: cloud → local ──────────────────────────────────────────
let unsubscribers: Unsubscribe[] = [];

export async function startRealtimeSync(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return;

  stopRealtimeSync();
  const firestore = getFirestoreDB();

  unsubscribers = SYNC_TABLES.map((table) => {
    const col = collection(firestore, userPath(table));
    return onSnapshot(col, (snap) => {
      const localTable = db.table(table);
      const ops: Promise<unknown>[] = [];

      snap.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (data.deleted || change.type === 'removed') {
          ops.push(localTable.delete(change.doc.id).catch(() => {}));
          return;
        }
        ops.push(
          localTable.get(change.doc.id).then((existing) => {
            const ex = existing as Record<string, unknown> | undefined;
            if (ex && (ex.updatedAt ?? 0) > (data.updatedAt ?? 0)) return; // local newer
            return localTable.put({ ...data, id: change.doc.id } as never);
          }).catch(() => {})
        );
      });

      // Once every cloud write has landed in Dexie, tell the UI stores
      // to re-read so live cross-device changes appear immediately.
      Promise.all(ops)
        .then(() => notifyStoreRefresh(table))
        .catch(() => {});
    }, () => { /* transient — will retry on reconnect */ });
  });
}

export function stopRealtimeSync(): void {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
}

// ── Auto-push on local changes (debounced) ────────────────────────────
let hooksAttached = false;
const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleTablePush(table: string): void {
  if (!isFirebaseConfigured()) return;
  if (!isDocumentVisible()) return;
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return;

  const timer = pushTimers.get(table);
  if (timer) clearTimeout(timer);
  pushTimers.set(table, setTimeout(async () => {
    pushTimers.delete(table);
    try { await pushAllToCloud(); } catch { /* retry on next change */ }
  }, 800));
}

function tombstone(table: string, id: string): void {
  if (!isFirebaseConfigured()) return;
  if (!isDocumentVisible()) return;
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return;
  const firestore = getFirestoreDB();
  const col = collection(firestore, userPath(table));
  setDoc(doc(col, id), { deleted: true, updatedAt: Date.now() }).catch(() => {});
}

export function attachAutoPush(): void {
  if (hooksAttached) return;
  hooksAttached = true;

  // Dexie 4 supports table hooks (creating/updating/deleting); the old
  // db.on('changes') event no longer exists in v4 and throws at runtime.
  for (const table of SYNC_TABLES) {
    const t = db.table(table) as never as {
      hook(name: string, fn: (...args: any[]) => void): void;
    };
    t.hook('creating', (...args: any[]) => {
      const obj = args[1] as { id?: string } | undefined;
      scheduleTablePush(table);
      void obj;
    });
    t.hook('updating', (...args: any[]) => {
      const obj = args[2] as { id?: string } | undefined;
      scheduleTablePush(table);
      void obj;
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

// ── Full one-shot sync (used by App startup) ──────────────────────────
export async function syncNow(): Promise<CountMap> {
  const pulled = await pullAllFromCloud();
  const pushed = await pushAllToCloud();
  return { ...pulled, ...pushed };
}
