import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Navigation: mod+1 through mod+5
      if (mod && !e.shiftKey) {
        const navMap: Record<string, string> = {
          '1': '/',
          '2': '/kanban',
          '3': '/vault',
          '4': '/impact',
          '5': '/calendar',
        };
        if (navMap[e.key]) {
          e.preventDefault();
          navigate(navMap[e.key]);
        }
      }

      // Quick actions
      if (mod && e.key === 'k') {
        e.preventDefault();
        // Command palette — will be implemented in Phase 6
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
