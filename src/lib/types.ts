// ══════════════════════════════════════════════════════════════
// JY Workstation — TypeScript Type Definitions
// ══════════════════════════════════════════════════════════════

// ── AUTH ──
export interface AuthRecord {
  id: string;
  salt: number[];
  verifyIv: number[];
  verifyCipher: number[];
}

// ── PRIORITIES ──
export interface Priority {
  id: string;
  date: string;
  rank: 1 | 2 | 3;
  title: string;
  completed: boolean;
  createdAt: number;
}

// ── KANBAN ──
export type KanbanColumn = 'backlog' | 'in-progress' | 'testing' | 'completed';
export type TaskCategory = 'ai-tooling' | 'data-pipeline' | 'dashboarding' | 'automation' | 'documentation';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  column: KanbanColumn;
  category: TaskCategory;
  priority: 1 | 2 | 3 | 4 | 5;
  subtasks: Subtask[];
  targetDate?: string;
  securityReviewPassed: boolean;
  createdAt: number;
  updatedAt: number;
}

// ── BLOCKERS ──
export type BlockerStatus = 'open' | 'escalated' | 'resolved';

export interface Blocker {
  id: string;
  title: string;
  description: string;
  status: BlockerStatus;
  escalatedTo?: string;
  resolution?: string;
  createdAt: number;
  resolvedAt?: number;
}

// ── SNIPPETS ──
export type SnippetCategory = 'python-wrangling' | 'sql-query' | 'sop-drafting' | 'code-optimization' | 'llm-prompts';

export interface Snippet {
  id: string;
  title: string;
  content: string;
  category: SnippetCategory;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

// ── DATA REGISTRY ──
export type DataSourceType = 'sql-table' | 'api' | 'powerbi' | 'file';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  schema?: string;
  endpoint?: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

// ── CYBERSECURITY CHECKLIST ──
export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  checked: boolean;
}

// ── STAR ENTRIES ──
export interface STAREntry {
  id: string;
  weekStart: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  quantitativeMetrics: string;
  createdAt: number;
  updatedAt: number;
}

// ── SOP DOCUMENTS ──
export type SOPStatus = 'drafting' | 'supervisor-review' | 'published';

export interface SOPDocument {
  id: string;
  title: string;
  status: SOPStatus;
  lastEdited: number;
  url?: string;
}

// ── CALENDAR ──
export type BlockType = 'work-shift' | 'commute' | 'study' | 'sat-shift' | 'custom';

export interface TimeBlock {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  type: BlockType;
  label: string;
  color: string;
}

// ── QUICK NOTES ──
export interface QuickNote {
  id: string;
  date: string;
  content: string;
  createdAt: number;
}

// ── SCRATCHPAD ──
export interface ScratchNote {
  id: string;
  date: string;
  content: string;
  plainText: string;
  updatedAt: number;
}

// ── SYNC CONFIG ──
export interface SyncConfig {
  id: string;
  vaultName: string;
  dailyNoteFolder: string;
  starFolder: string;
  autoExportEnabled: boolean;
  autoExportInterval: number;
  lastExportAt: number | null;
}

// ── APP SETTINGS ──
export type Theme = 'light-sakura' | 'dark-sakura';

export interface AppSettings {
  id: string;
  theme: Theme;
  sidebarCollapsed: boolean;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
}

// ── EXPORT NOTE ──
export interface ExportNote {
  title: string;
  folder: string;
  content: string;
  tags: string[];
  date: string;
}
