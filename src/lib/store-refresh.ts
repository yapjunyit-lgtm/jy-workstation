/**
 * Store Refresh Bridge — lets cloud-originated Dexie writes (Firestore
 * snapshots, pulls) tell the in-memory Zustand stores to re-read their
 * data. Without this, UI state goes stale when another browser/device
 * pushes changes.
 */
type RefreshFn = () => void;

const registry = new Map<string, Set<RefreshFn>>();

export function registerStoreRefresh(table: string, fn: RefreshFn): void {
  let set = registry.get(table);
  if (!set) {
    set = new Set();
    registry.set(table, set);
  }
  set.add(fn);
}

export function notifyStoreRefresh(table: string): void {
  const fns = registry.get(table);
  if (!fns) return;
  fns.forEach((fn) => {
    try { fn(); } catch { /* a failing refresh shouldn't break sync */ }
  });
}
