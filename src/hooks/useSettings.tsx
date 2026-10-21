import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS, storage } from '@/lib/storage';

interface Ctx {
  settings: Settings;
  setSettings: (updater: Partial<Settings> | ((s: Settings) => Settings)) => void;
  reset: () => void;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setState] = useState<Settings>(() => storage.loadSettings());

  useEffect(() => {
    storage.saveSettings(settings);
    const root = document.documentElement;
    const applyDark = (dark: boolean) => root.classList.toggle('dark', dark);
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mq.matches);
      const listener = (e: MediaQueryListEvent) => applyDark(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
    applyDark(settings.theme === 'dark');
  }, [settings]);

  const value = useMemo<Ctx>(
    () => ({
      settings,
      setSettings: (updater) =>
        setState((prev) =>
          typeof updater === 'function' ? updater(prev) : { ...prev, ...updater },
        ),
      reset: () => setState(DEFAULT_SETTINGS),
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}