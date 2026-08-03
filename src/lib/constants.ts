import type { SnippetCategory, TaskCategory } from './types';

// ── SHIFT SCHEDULE ──
export const WORK_START_HOUR = 8.5;
export const WORK_END_HOUR = 17.5;
export const COMMUTE_MINUTES = 25;

// ── KANBAN COLUMNS ──
export const KANBAN_COLUMNS = [
  { id: 'backlog' as const, label: 'Backlog', icon: 'Inbox' },
  { id: 'in-progress' as const, label: 'In Progress', icon: 'Play' },
  { id: 'testing' as const, label: 'Testing / QA', icon: 'FlaskConical' },
  { id: 'completed' as const, label: 'Completed', icon: 'CheckCircle' },
];

// ── TASK CATEGORIES ──
export const TASK_CATEGORIES: { id: TaskCategory; label: string; color: string }[] = [
  { id: 'ai-tooling',       label: 'AI Tooling',          color: 'var(--info)' },
  { id: 'data-pipeline',    label: 'Data Pipeline',       color: 'var(--accent)' },
  { id: 'dashboarding',     label: 'Dashboarding',        color: 'var(--success)' },
  { id: 'automation',       label: 'Automation',          color: 'var(--warning)' },
  { id: 'documentation',    label: 'Documentation / SOP',  color: 'var(--danger)' },
];

// ── SNIPPET CATEGORIES ──
export const SNIPPET_CATEGORIES: { id: SnippetCategory; label: string }[] = [
  { id: 'python-wrangling',  label: 'Python Data Wrangling' },
  { id: 'sql-query',         label: 'SQL Query Gen' },
  { id: 'sop-drafting',      label: 'SOP Drafting' },
  { id: 'code-optimization', label: 'Code Optimization' },
  { id: 'llm-prompts',       label: 'LLM System Prompts' },
];

// ── BLOCKER STATUSES ──
export const BLOCKER_STATUSES = [
  { id: 'open' as const,      label: 'Open',      color: 'badge-danger' },
  { id: 'escalated' as const, label: 'Escalated',  color: 'badge-warning' },
  { id: 'resolved' as const,  label: 'Resolved',   color: 'badge-success' },
];

// ── SOP STATUSES ──
export const SOP_STATUSES = [
  { id: 'drafting' as const,          label: 'Drafting' },
  { id: 'supervisor-review' as const, label: 'Supervisor Review' },
  { id: 'published' as const,         label: 'Published' },
];

// ── BLOCK TYPE COLORS ──
export const BLOCK_COLORS: Record<string, string> = {
  'work-shift': '#C9A96E',
  'commute':    '#D5CFC6',
  'study':      '#8A9FB8',
  'sat-shift':  '#C4887C',
  'custom':     '#8B9D83',
};
