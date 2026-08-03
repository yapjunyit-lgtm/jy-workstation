import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Undo, Redo, Heading2, Heading3,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), label: 'Bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), label: 'Italic' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), label: 'Strikethrough' },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code'), label: 'Inline Code' },
    { type: 'divider' as const },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), label: 'H2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), label: 'H3' },
    { type: 'divider' as const },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), label: 'Bullet List' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), label: 'Numbered List' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), label: 'Quote' },
    { type: 'divider' as const },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false, label: 'Undo' },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false, label: 'Redo' },
  ];

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap"
      style={{ borderColor: 'var(--border-color)' }}
    >
      {tools.map((tool, i) => {
        if ('type' in tool && tool.type === 'divider') {
          return (
            <div
              key={i}
              className="w-px h-4 mx-1"
              style={{ background: 'var(--border-color)' }}
            />
          );
        }

        const Icon = tool.icon!;
        return (
          <button
            key={i}
            onClick={tool.action}
            className="btn-sakura btn-ghost btn-sm rounded"
            style={{
              color: tool.active ? 'var(--accent)' : 'var(--text-secondary)',
              background: tool.active ? 'var(--accent-soft)' : 'transparent',
            }}
            title={tool.label}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
