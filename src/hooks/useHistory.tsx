import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { HistoryEntry, NotebookEntry } from '@/types';
import { storage } from '@/lib/storage';

interface Ctx {
  history: HistoryEntry[];
  addHistory: (expression: string, result: string, source?: string) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  notebook: NotebookEntry[];
  addNotebook: (name: string, expression: string, result: string, note?: string) => void;
  renameNotebook: (id: string, name: string) => void;
  deleteNotebook: (id: string) => void;
  recent: string[];
  pushRecent: (toolId: string) => void;
}

const HistoryContext = createContext<Ctx | null>(null);

const MAX_HISTORY = 200;

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => storage.loadHistory());
  const [notebook, setNotebook] = useState<NotebookEntry[]>(() => storage.loadNotebook());
  const [recent, setRecent] = useState<string[]>(() => storage.loadRecent());

  useEffect(() => storage.saveHistory(history), [history]);
  useEffect(() => storage.saveNotebook(notebook), [notebook]);
  useEffect(() => storage.saveRecent(recent), [recent]);

  const addHistory = useCallback((expression: string, result: string, source?: string) => {
    setHistory((prev) =>
      [{ id: uid(), expression, result, timestamp: Date.now(), source }, ...prev].slice(0, MAX_HISTORY),
    );
  }, []);

  const removeHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const addNotebook = useCallback(
    (name: string, expression: string, result: string, note?: string) => {
      setNotebook((prev) => [
        { id: uid(), name, expression, result, note, timestamp: Date.now() },
        ...prev,
      ]);
    },
    [],
  );

  const renameNotebook = useCallback((id: string, name: string) => {
    setNotebook((prev) => prev.map((n) => (n.id === id ? { ...n, name } : n)));
  }, []);

  const deleteNotebook = useCallback((id: string) => {
    setNotebook((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const pushRecent = useCallback((toolId: string) => {
    setRecent((prev) => [toolId, ...prev.filter((t) => t !== toolId)].slice(0, 6));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      history, addHistory, removeHistory, clearHistory,
      notebook, addNotebook, renameNotebook, deleteNotebook,
      recent, pushRecent,
    }),
    [history, notebook, recent, addHistory, removeHistory, clearHistory, addNotebook, renameNotebook, deleteNotebook, pushRecent],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
}