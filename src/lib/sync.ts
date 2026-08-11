import { db } from './db';
import { ObsidianExport } from './obsidian-export';
import type { ExportNote } from './types';

export async function exportAllAsMarkdownZip(): Promise<void> {
  const notes: ExportNote[] = [];

  const scratchNotes = await db.scratchNotes.toArray();
  scratchNotes.forEach((n) => {
    notes.push(ObsidianExport.scratchToExportNote({ date: n.date, content: n.plainText || n.content }));
  });

  const starEntries = await db.starEntries.toArray();
  starEntries.forEach((e) => {
    notes.push(ObsidianExport.starToExportNote(e));
  });

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const note of notes) {
    const path = `${note.folder}/${note.title.replace(/\s+/g, '_')}.md`;
    zip.file(path, ObsidianExport.toMarkdown(note));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `JY_Workstation_Export_${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportFullBackupJSON(): Promise<void> {
  const tables = [
    'priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources',
    'checklistItems', 'starEntries', 'sopDocuments', 'timeBlocks',
    'scratchNotes', 'quickNotes', 'aiConversations', 'syncConfig', 'appSettings',
  ] as const;

  const backup: Record<string, unknown[]> = {};
  for (const table of tables) {
    backup[table] = await db.table(table).toArray();
  }

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `JY_Workstation_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFullBackupJSON(file: File): Promise<void> {
  const text = await file.text();
  const backup = JSON.parse(text);

  const tables = [
    'priorities', 'kanbanTasks', 'blockers', 'snippets', 'dataSources',
    'checklistItems', 'starEntries', 'sopDocuments', 'timeBlocks',
    'scratchNotes', 'quickNotes', 'aiConversations', 'syncConfig', 'appSettings',
  ] as const;

  for (const table of tables) {
    if (backup[table] && Array.isArray(backup[table])) {
      await db.table(table).clear();
      await db.table(table).bulkAdd(backup[table]);
    }
  }
}
