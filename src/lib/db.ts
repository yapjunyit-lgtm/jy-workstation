import Dexie from 'dexie';
import type { Table } from 'dexie';
import type {
  AuthRecord, Priority, KanbanTask, Blocker, Snippet,
  DataSource, ChecklistItem, STAREntry, SOPDocument,
  TimeBlock, ScratchNote, SyncConfig, AppSettings, QuickNote,
} from './types';

export class WorkstationDB extends Dexie {
  auth!: Table<AuthRecord, string>;
  priorities!: Table<Priority, string>;
  kanbanTasks!: Table<KanbanTask, string>;
  blockers!: Table<Blocker, string>;
  snippets!: Table<Snippet, string>;
  dataSources!: Table<DataSource, string>;
  checklistItems!: Table<ChecklistItem, string>;
  starEntries!: Table<STAREntry, string>;
  sopDocuments!: Table<SOPDocument, string>;
  timeBlocks!: Table<TimeBlock, string>;
  scratchNotes!: Table<ScratchNote, string>;
  quickNotes!: Table<QuickNote, string>;
  syncConfig!: Table<SyncConfig, string>;
  appSettings!: Table<AppSettings, string>;

  constructor() {
    super('JYWorkstation');

    this.version(1).stores({
      auth:            'id',
      priorities:      'id, date, rank',
      kanbanTasks:     'id, column, category, priority, targetDate',
      blockers:        'id, status',
      snippets:        'id, category, *tags',
      dataSources:     'id, type',
      checklistItems:  'id, category',
      starEntries:     'id, weekStart',
      sopDocuments:    'id, status',
      timeBlocks:      'id, date, type',
      scratchNotes:    'id, date',
      syncConfig:      'id',
      appSettings:     'id',
    });

    this.version(2).stores({
      quickNotes:      'id, date, createdAt',
    });
  }
}

export const db = new WorkstationDB();
