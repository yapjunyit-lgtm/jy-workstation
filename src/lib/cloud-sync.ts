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
import {
  getFirestoreDB, getFirebaseAuth, isFirebaseConfigured, ensureSignedIn,
} from './firebase';
import {
  collection, doc, getDocs, setDoc, onSnapshot,
  query, limit, type Unsubscribe,
} from 'firebase/firestore';

export const SYNC_TABLES = [
  'priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources',
  'checklistItems', 'starEntries', 'sopDocuments', 'timeBlocks',
  'scratchNotes', 'syncConfig', 'appSettings',
] as const;

export type SyncTableName = (typeof SYNC_TABLES)[number];
type CountMap = Record<string, number>;

interface DexieChangeRecord {
  table: string;
  type: number; // 1=created, 2=updated, 3=deleted
  key?: unknown;
  oldObj?: { id?: string };
}

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
  await ensureSignedIn();
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
  await ensureSignedIn();
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

  try {
    await ensureSignedIn();
    const firestore = getFirestoreDB();
    for (const table of SYNC_TABLES) {
      try {
        const col = collection(firestore, userPath(table));
        const snap = await getDocs(query(col, limit(5000)));
        remote += snap.size;
      } catch { /* ignore */ }
    }
  } catch { /* not signed in */ }

  return { local, remote };
}

// ── Real-time: cloud → local ──────────────────────────────────────────
let unsubscribers: Unsubscribe[] = [];

export async function startRealtimeSync(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await ensureSignedIn().catch(() => {});
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return;

  stopRealtimeSync();
  const firestore = getFirestoreDB();

  unsubscribers = SYNC_TABLES.map((table) => {
    const col = collection(firestore, userPath(table));
    return onSnapshot(col, (snap) => {
      const localTable = db.table(table);
      snap.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (data.deleted || change.type === 'removed') {
          localTable.delete(change.doc.id).catch(() => {});
          return;
        }
        localTable.get(change.doc.id).then((existing) => {
          const ex = existing as Record<string, unknown> | undefined;
          if (ex && (ex.updatedAt ?? 0) > (data.updatedAt ?? 0)) return; // local newer
          return localTable.put({ ...data, id: change.doc.id } as never);
        }).catch(() => {});
      });
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

export function attachAutoPush(): void {
  if (hooksAttached) return;
  hooksAttached = true;

  // Dexie's "changes" event exists at runtime; typings for it are
  // incomplete in some versions, so cast the event set.
  const dbEvents = db.on as unknown as {
    (event: 'changes', subscriber: (changes: DexieChangeRecord[]) => void): void;
  };

  dbEvents('changes', (changes) => {
    if (!isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return;

    const tables = new Set<string>();
    changes.forEach((change) => {
      if (!SYNC_TABLES.includes(change.table as SyncTableName)) return;
      tables.add(change.table);

      // Tombstone deletes so they reach other devices
      if (change.type === 3 && change.oldObj?.id) {
        const firestore = getFirestoreDB();
        const col = collection(firestore, userPath(change.table));
        setDoc(doc(col, change.oldObj.id as string), {
          deleted: true,
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    });

    tables.forEach((table) => {
      const timer = pushTimers.get(table);
      if (timer) clearTimeout(timer);
      pushTimers.set(table, setTimeout(async () => {
        pushTimers.delete(table);
        try { await pushAllToCloud(); } catch { /* retry next change */ }
      }, 800));
    });
  });
}

// ── Full one-shot sync (used by App startup) ──────────────────────────
export async function syncNow(): Promise<CountMap> {
  const pulled = await pullAllFromCloud();
  const pushed = await pushAllToCloud();
  return { ...pulled, ...pushed };
}
