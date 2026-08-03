import type { ExportNote } from './types';
import { generateSTARSummary } from './utils';

export const ObsidianExport = {
  toMarkdown(note: ExportNote): string {
    const lines: string[] = [
      '---',
      `created: ${note.date}`,
      `source: jy-workstation`,
      `tags: [${note.tags.join(', ')}]`,
      '---',
      '',
      note.content,
    ];
    return lines.join('\n');
  },

  downloadNote(note: ExportNote): void {
    const md = ObsidianExport.toMarkdown(note);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  },

  starToExportNote(entry: {
    weekStart: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    quantitativeMetrics: string;
  }): ExportNote {
    const summary = generateSTARSummary(entry);
    return {
      title: `STAR_${entry.weekStart}`,
      folder: 'STAR Entries',
      content: [
        `## Situation\n${entry.situation}`,
        `## Task\n${entry.task}`,
        `## Action\n${entry.action}`,
        `## Result\n${entry.result}`,
        `### Quantitative Metrics\n${entry.quantitativeMetrics}`,
        '',
        `**Summary**: ${summary}`,
      ].join('\n\n'),
      tags: ['star', 'brag-doc', `week-${entry.weekStart}`],
      date: entry.weekStart,
    };
  },

  scratchToExportNote(note: { date: string; content: string }): ExportNote {
    return {
      title: `Daily_Note_${note.date}`,
      folder: 'Daily Notes',
      content: note.content,
      tags: ['daily-note', note.date],
      date: note.date,
    };
  },
};
