import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKanbanStore } from '../stores/useKanbanStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const kanbanAdd = useKanbanStore((s) => s.add);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // ⌘K — Command palette (global, even in inputs)
      if (mod && e.key === 'k') {
        e.preventDefault();
        return;
      }

      // Don't trigger shortcuts when typing in inputs/editor
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]')
      ) {
        return;
      }

      // Navigation: mod+1 through mod+6
      if (mod && !e.shiftKey) {
        const navMap: Record<string, string> = {
          '1': '/',
          '2': '/kanban',
          '3': '/vault',
          '4': '/impact',
          '5': '/calendar',
          '6': '/settings',
        };
        if (navMap[e.key]) {
          e.preventDefault();
          navigate(navMap[e.key]);
        }
      }

      // Global single-key shortcuts
      if (!mod && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            kanbanAdd({ column: 'backlog', title: 'New Task' });
            break;
          case 'b':
            e.preventDefault();
            const blockerBtn = document.querySelector('[data-add-blocker]') as HTMLElement;
            blockerBtn?.click();
            break;
          case 'escape':
            // Close any open modals handled by components themselves
            break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, kanbanAdd]);
}
