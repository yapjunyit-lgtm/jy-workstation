import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useScratchpadStore } from '../../stores/useScratchpadStore';
import { EditorToolbar } from './EditorToolbar';
import { ObsidianExport } from '../../lib/obsidian-export';

export function RichEditor() {
  const { note, loading, loadToday, save } = useScratchpadStore();

  useEffect(() => {
    loadToday();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Write meeting notes, error logs, quick thoughts...',
      }),
    ],
    content: note?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      save(html, text);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-5 py-4 min-h-[200px]',
      },
    },
  });

  // Sync content when note changes (e.g., date change)
  useEffect(() => {
    if (editor && note && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content || '');
    }
  }, [note?.id]);

  const handleObsidianExport = () => {
    if (!note) return;
    const exportNote = ObsidianExport.scratchToExportNote({
      date: note.date,
      content: note.plainText || note.content,
    });
    ObsidianExport.downloadNote(exportNote);
  };

  if (loading) {
    return (
      <div className="card-static">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading scratchpad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-static overflow-hidden" style={{ padding: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Scratchpad
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-xs mr-1" style={{ color: 'var(--text-tertiary)' }}>
            {note?.date}
          </span>
          <button
            onClick={handleObsidianExport}
            className="btn-sakura btn-ghost btn-sm"
            title="Export to Obsidian"
          >
            📓
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
