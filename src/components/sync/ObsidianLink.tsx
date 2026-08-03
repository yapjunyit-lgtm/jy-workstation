import { BookOpen } from 'lucide-react';
import { ObsidianURI } from '../../lib/obsidian-uri';
import { useSyncStore } from '../../stores/useSyncStore';
import { ObsidianExport } from '../../lib/obsidian-export';
import type { ExportNote } from '../../lib/types';

interface ObsidianLinkProps {
  note?: ExportNote;
  filename?: string;
  content?: string;
  variant?: 'create' | 'open';
}

export function ObsidianLink({ note, filename, content, variant = 'create' }: ObsidianLinkProps) {
  const { config } = useSyncStore();

  const handleClick = () => {
    if (note) {
      ObsidianExport.downloadNote(note);
    } else if (filename && content) {
      ObsidianURI.createNote(config.vaultName, filename, content);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="btn-sakura btn-ghost btn-sm"
      title={`${variant === 'create' ? 'Create in' : 'Open in'} Obsidian`}
    >
      <BookOpen size={14} />
      <span className="text-xs">Obsidian</span>
    </button>
  );
}
