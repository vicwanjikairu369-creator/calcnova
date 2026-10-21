import type { HistoryEntry, NotebookEntry, Settings } from '@/types';

const HISTORY_KEY = 'calcnova:history:v1';
const NOTEBOOK_KEY = 'calcnova:notebook:v1';
const SETTINGS_KEY = 'calcnova:settings:v1';
const RECENT_KEY = 'calcnova:recent:v1';

function safeGet<T>(key: string, fallback: T, validate: (x: unknown) => x is T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or blocked — ignore */
  }
}

const isHistoryArray = (x: unknown): x is HistoryEntry[] =>
  Array.isArray(x) &&
  x.every(
    (e) =>
      e &&
      typeof e === 'object' &&
      typeof (e as HistoryEntry).id === 'string' &&
      typeof (e as HistoryEntry).expression === 'string' &&
      typeof (e as HistoryEntry).result === 'string' &&
      typeof (e as HistoryEntry).timestamp === 'number',
  );

const isNotebookArray = (x: unknown): x is NotebookEntry[] =>
  Array.isArray(x) &&
  x.every(
    (e) =>
      e &&
      typeof e === 'object' &&
      typeof (e as NotebookEntry).id === 'string' &&
      typeof (e as NotebookEntry).name === 'string' &&
      typeof (e as NotebookEntry).expression === 'string',
  );

const isSettings = (x: unknown): x is Settings =>
  !!x &&
  typeof x === 'object' &&
  ['light', 'dark', 'system'].includes((x as Settings).theme) &&
  ['deg', 'rad'].includes((x as Settings).angleMode) &&
  typeof (x as Settings).precision === 'number';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  angleMode: 'deg',
  precision: 12,
  thousandsSeparator: false,
};

export const storage = {
  loadHistory: () => safeGet<HistoryEntry[]>(HISTORY_KEY, [], isHistoryArray),
  saveHistory: (h: HistoryEntry[]) => safeSet(HISTORY_KEY, h),

  loadNotebook: () => safeGet<NotebookEntry[]>(NOTEBOOK_KEY, [], isNotebookArray),
  saveNotebook: (n: NotebookEntry[]) => safeSet(NOTEBOOK_KEY, n),

  loadSettings: () => safeGet<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS, isSettings),
  saveSettings: (s: Settings) => safeSet(SETTINGS_KEY, s),

  loadRecent: () => safeGet<string[]>(RECENT_KEY, [], (x): x is string[] => Array.isArray(x)),
  saveRecent: (r: string[]) => safeSet(RECENT_KEY, r),
};

export { DEFAULT_SETTINGS };