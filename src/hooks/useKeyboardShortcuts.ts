import { useEffect } from 'react';

interface ShortcutOptions {
  onSearch: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onEscape }: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Open Search (Cmd+K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearch();
        return;
      }

      // 2. Close modals (Escape)
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
    };

    // Attach to window
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSearch, onEscape]);
}