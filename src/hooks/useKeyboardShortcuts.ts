import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // ⌘K — Command palette (global, even in inputs)
      if (mod && e.key === 'k') {
        e.preventDefault();
        // Phase 6: CommandPalette toggle
        return;
      }

      // Don't trigger shortcuts when typing in inputs/editor
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
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

      // Global single-key shortcuts (no mod key)
      if (!mod && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            navigate('/kanban');
            // Focus new task input
            setTimeout(() => {
              const btn = document.querySelector('[data-new-task]') as HTMLElement;
              btn?.click();
            }, 100);
            break;
          case 'b':
            e.preventDefault();
            // Focus blocker input
            const blockerBtn = document.querySelector('[data-add-blocker]') as HTMLElement;
            blockerBtn?.click();
            break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
