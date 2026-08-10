import { useEffect, useState, useRef } from 'react';
import { Download } from 'lucide-react';
import { useScratchpadStore } from '../../stores/useScratchpadStore';
import { ObsidianExport } from '../../lib/obsidian-export';

type ViewMode = 'edit' | 'split' | 'preview';

export function RichEditor() {
  const { note, loading, loadToday, save } = useScratchpadStore();
  const [text, setText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [saveState, setSaveState] = useState('Saved');
  const previewRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    if (note && text === '' && note.content) {
      setText(note.content);
    }
  }, [note]);

  useEffect(() => {
    if (previewRef.current && text) {
      try {
        // Simple markdown rendering (marked.js not bundled)
        previewRef.current.innerHTML = renderMarkdown(text);
      } catch {
        previewRef.current.textContent = text;
      }
    }
  }, [text]);

  const handleChange = (value: string) => {
    setText(value);
    setSaveState('Saving…');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      save(value, value);
      setSaveState('Saved');
    }, 500);
  };

  const handleObsidianExport = () => {
    if (!note) return;
    ObsidianExport.downloadNote(
      ObsidianExport.scratchToExportNote({ date: note.date, content: text })
    );
  };

  if (loading) {
    return (
      <div className="card-static">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    fontSize: 12,
    borderRadius: 6,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: active ? 'var(--bg-subtle)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 120ms ease-out, color 120ms ease-out',
    fontFamily: 'inherit',
  });

  return (
    <div className="card-static" style={{ display: 'flex', flexDirection: 'column', minHeight: 360 }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 pb-2">
        <button style={btnStyle(viewMode === 'edit')} onClick={() => setViewMode('edit')}>Edit</button>
        <button style={btnStyle(viewMode === 'split')} onClick={() => setViewMode('split')}>Split</button>
        <button style={btnStyle(viewMode === 'preview')} onClick={() => setViewMode('preview')}>Preview</button>
        <div className="flex-1" />
        <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{saveState}</span>
        <button
          onClick={handleObsidianExport}
          className="text-xs px-2 py-0.5 rounded transition-soft"
          style={{ color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
          title="Export to Obsidian"
          aria-label="Export scratchpad to Obsidian"
        >
          <Download size={13} aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr',
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Editor */}
        {viewMode !== 'preview' && (
          <textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write meeting notes, error logs, quick thoughts… (Markdown supported)"
            style={{
              width: '100%',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: 12,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12.5px',
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              resize: 'none',
              minHeight: 300,
            }}
            aria-label="Scratchpad editor"
          />
        )}

        {/* Preview */}
        {viewMode !== 'edit' && (
          <div
            ref={previewRef}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '12px 16px',
              overflowY: 'auto',
              minHeight: 300,
              fontSize: 13,
              lineHeight: 1.65,
              color: 'var(--text-primary)',
            }}
          >
            {!text && (
              <span style={{ color: 'var(--text-tertiary)' }}>Preview will appear here</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple markdown renderer (replaces marked.js to avoid dependency)
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, _lang, code) =>
      `<pre style="background:var(--bg-surface);padding:10px 12px;border-radius:6px;overflow-x:auto;"><code>${code.trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="font-family:JetBrains Mono,monospace;font-size:12px;background:var(--bg-surface);padding:2px 5px;border-radius:3px;">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;margin:12px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;margin:14px 0 8px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;margin:16px 0 10px;">$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding-left:10px;color:var(--text-secondary);margin:8px 0;">$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li style="list-style:disc;margin-left:20px;">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li style="list-style:decimal;margin-left:20px;">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent);text-decoration:underline;">$1</a>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p style="margin:8px 0;">');

  return '<p style="margin:8px 0;">' + html + '</p>';
}
