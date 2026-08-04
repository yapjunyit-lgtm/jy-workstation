import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { getFirebaseDB, isFirebaseConfigured } from './firebase';
import { db as localDB } from './db';

// ── Sync a single table up to Firestore ──
async function pushTable(tableName: string): Promise<number> {
  const firestore = getFirebaseDB();
  if (!firestore) return 0;

  const records = await localDB.table(tableName).toArray();
  if (records.length === 0) return 0;

  const batch = writeBatch(firestore);
  records.forEach((record: any) => {
    const ref = doc(firestore, tableName, record.id || record.date || crypto.randomUUID());
    batch.set(ref, { ...record, _syncedAt: Date.now() });
  });

  await batch.commit();
  return records.length;
}

// ── Pull a single table from Firestore ──
async function pullTable(tableName: string): Promise<number> {
  const firestore = getFirebaseDB();
  if (!firestore) return 0;

  const snapshot = await getDocs(collection(firestore, tableName));
  if (snapshot.empty) return 0;

  const records: any[] = [];
  snapshot.forEach((d) => {
    const data = d.data();
    delete data._syncedAt;
    records.push({ ...data, id: data.id || d.id });
  });

  await localDB.table(tableName).clear();
  await localDB.table(tableName).bulkAdd(records);
  return records.length;
}

// ── Full push (local → cloud) ──
export async function pushAllToCloud(): Promise<Record<string, number>> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');

  const tables = [
    'priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources',
    'checklistItems', 'starEntries', 'sopDocuments', 'timeBlocks', 'scratchNotes',
  ];

  const results: Record<string, number> = {};
  for (const table of tables) {
    results[table] = await pushTable(table);
  }
  return results;
}

// ── Full pull (cloud → local) ──
export async function pullAllFromCloud(): Promise<Record<string, number>> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');

  const tables = [
    'priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources',
    'checklistItems', 'starEntries', 'sopDocuments', 'timeBlocks', 'scratchNotes',
  ];

  const results: Record<string, number> = {};
  for (const table of tables) {
    results[table] = await pullTable(table);
  }
  return results;
}

// ── Sync status ──
export async function getCloudStats(): Promise<{ local: number; remote: number } | null> {
  if (!isFirebaseConfigured()) return null;

  const firestore = getFirebaseDB();
  if (!firestore) return null;

  let localCount = 0;
  const tables = ['priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources', 'starEntries', 'sopDocuments', 'timeBlocks', 'scratchNotes', 'checklistItems'];
  for (const table of tables) {
    localCount += await localDB.table(table).count();
  }

  let remoteCount = 0;
  try {
    const snapshot = await getDocs(collection(firestore, 'kanbanTasks'));
    remoteCount += snapshot.size;
  } catch { /* ignore */ }

  return { local: localCount, remote: remoteCount };
}
