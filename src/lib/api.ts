import { db } from './db';
import type { Table } from 'dexie';

export interface IDataRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | undefined>;
  remove(id: string): Promise<void>;
}

export class LocalRepository<T> implements IDataRepository<T> {
  private table: Table<T, string>;

  constructor(table: Table<T, string>) {
    this.table = table;
  }

  getAll = () => this.table.toArray();
  getById = (id: string) => this.table.get(id);
  create = async (item: T) => { await this.table.add(item); return item; };
  update = async (id: string, patch: Partial<T>) => {
    const count = await this.table.update(id, patch as never);
    if (count === 0) return undefined;
    return this.table.get(id);
  };
  remove = (id: string) => this.table.delete(id);
}

export function createRepository<T>(tableName: string): IDataRepository<T> {
  const backendUrl = import.meta.env.VITE_API_URL;
  if (backendUrl) {
    console.warn('Remote API not yet implemented, falling back to local');
  }
  return new LocalRepository<T>(db.table(tableName));
}
