/**
 * JY Workstation — Local SQLite database (sql.js / WASM SQLite).
 * Stored as server/workspace.db (persisted on every mutation).
 */
import initSqlJs from 'sql.js';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DB_FILE = resolve(__dirname, 'workspace.db');

let db = null;

export async function initDB() {
  const SQL = await initSqlJs();
  db = existsSync(DB_FILE)
    ? new SQL.Database(readFileSync(DB_FILE))
    : new SQL.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      collection TEXT NOT NULL,
      id         TEXT NOT NULL,
      data       TEXT NOT NULL,
      updatedAt  INTEGER NOT NULL,
      deleted    INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (collection, id)
    );
    CREATE INDEX IF NOT EXISTS idx_records_updated ON records (updatedAt);
  `);
  persist();
  return db;
}

export function persist() {
  if (!db) return;
  writeFileSync(DB_FILE, Buffer.from(db.export()));
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function getAll(collection) {
  const rows = queryAll(
    'SELECT id, data, updatedAt, deleted FROM records WHERE collection = ? AND deleted = 0 ORDER BY updatedAt',
    [collection]
  );
  return rows.map((r) => ({ ...JSON.parse(r.data), id: r.id, updatedAt: r.updatedAt }));
}

export function upsertAll(collection, records) {
  let changed = 0;
  for (const rec of records) {
    const id = rec.id;
    if (id == null) continue;
    const { id: _id, updatedAt, deleted, ...rest } = rec;
    db.run(
      `INSERT INTO records (collection, id, data, updatedAt, deleted)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(collection, id) DO UPDATE SET
         data = excluded.data,
         updatedAt = excluded.updatedAt,
         deleted = excluded.deleted`,
      [collection, String(id), JSON.stringify(rest), updatedAt ?? Date.now(), deleted ? 1 : 0]
    );
    changed++;
  }
  persist();
  return changed;
}

export function getChanges(since) {
  const rows = queryAll(
    'SELECT collection, id, data, updatedAt, deleted FROM records WHERE updatedAt > ? ORDER BY updatedAt',
    [since || 0]
  );
  return rows.map((r) => ({
    collection: r.collection,
    id: r.id,
    data: JSON.parse(r.data),
    updatedAt: r.updatedAt,
    deleted: r.deleted === 1,
  }));
}

export function getStats() {
  const totalRes = db.exec('SELECT COUNT(*) FROM records WHERE deleted = 0');
  const total = totalRes.length ? totalRes[0].values[0][0] : 0;
  const byRes = db.exec('SELECT collection, COUNT(*) FROM records WHERE deleted = 0 GROUP BY collection');
  const map = {};
  for (const row of byRes.length ? byRes[0].values : []) map[row[0]] = row[1];
  return { total, byCollection: map };
}

// ── Workstation insights summary (fed to the AI assistant) ─────────────
export function summarizeWorkstation() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const soon = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const kanban = getAll('kanbanTasks');
  const byColumn = {};
  const byCategory = {};
  const overdue = [];
  for (const t of kanban) {
    byColumn[t.column] = (byColumn[t.column] || 0) + 1;
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    if (t.targetDate && t.targetDate < todayStr && t.column !== 'completed') {
      overdue.push({ id: t.id, title: t.title, due: t.targetDate, column: t.column });
    }
  }

  const blocks = getAll('timeBlocks');
  const upcoming = blocks
    .filter((b) => b.date >= todayStr && b.date <= soon)
    .sort((a, b) => (a.date + a.startHour).localeCompare(b.date + b.startHour))
    .slice(0, 15)
    .map((b) => ({ id: b.id, title: b.label, date: b.date, start: b.startHour, end: b.endHour, type: b.type }));

  const priorities = getAll('priorities')
    .filter((p) => p.date === todayStr)
    .map((p) => ({ id: p.id, rank: p.rank, title: p.title, done: p.completed }));

  const blockers = getAll('blockers')
    .filter((b) => b.status !== 'resolved')
    .map((b) => ({ id: b.id, title: b.title, status: b.status }));

  const stars = getAll('starEntries').slice(0, 3).map((s) => ({
    week: s.weekStart, result: s.result, metrics: s.quantitativeMetrics,
  }));

  const counts = {};
  for (const t of ['priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources',
    'checklistItems', 'starEntries', 'sopDocuments', 'timeBlocks', 'scratchNotes', 'quickNotes']) {
    counts[t] = getAll(t).length;
  }

  return {
    today: todayStr,
    counts,
    kanban: { total: kanban.length, byColumn, byCategory, overdue },
    upcomingEvents: upcoming,
    todayPriorities: priorities,
    openBlockers: blockers,
    recentStars: stars,
  };
}
