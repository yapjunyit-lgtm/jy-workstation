import { format, getDate } from 'date-fns';

// ── ID Generation ──
export function generateId(): string {
  return crypto.randomUUID();
}

// ── Date Helpers ──
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  return format(new Date(iso + 'T00:00:00'), 'EEE, MMM d');
}

export function formatDateTime(ts: number): string {
  return format(new Date(ts), 'MMM d, yyyy HH:mm');
}

export function formatTime(ts: number): string {
  return format(new Date(ts), 'HH:mm');
}

// ── Shift Detection ──
export interface ShiftInfo {
  type: 'weekday' | 'sat-shift' | 'off';
  label: string;
  emoji: string;
  color: string;
}

export function getShiftInfo(date: Date = new Date()): ShiftInfo {
  const day = date.getDay();
  const dayOfMonth = getDate(date);
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  if (day === 6 && (weekOfMonth === 1 || weekOfMonth >= 4)) {
    return { type: 'sat-shift', label: 'Saturday Shift', emoji: '\u{1F6E2}️', color: 'var(--danger)' };
  }
  if (day >= 1 && day <= 5) {
    return { type: 'weekday', label: 'Standard Weekday', emoji: '\u{1F33F}', color: 'var(--success)' };
  }
  return { type: 'off', label: 'Off / Study Day', emoji: '\u{1F393}', color: 'var(--text-tertiary)' };
}

// ── Pomodoro Formatting ──
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ── Clipboard ──
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  }
}

// ── CN (className merger) ──
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── STAR Summary Generator ──
export function generateSTARSummary(entry: { action: string; result: string; quantitativeMetrics: string }): string {
  const parts: string[] = [];
  if (entry.action) parts.push(entry.action);
  if (entry.result) parts.push(`resulting in ${entry.result}`);
  if (entry.quantitativeMetrics) parts.push(`(${entry.quantitativeMetrics})`);
  return parts.join(', ');
}

// ── Truncate ──
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

// ── Debounce ──
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
