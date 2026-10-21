export type ThemeMode = 'light' | 'dark' | 'system';
export type AngleMode = 'deg' | 'rad';

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  source?: string;
}

export interface NotebookEntry {
  id: string;
  name: string;
  expression: string;
  result: string;
  note?: string;
  timestamp: number;
}

export interface Settings {
  theme: ThemeMode;
  angleMode: AngleMode;
  precision: number; // significant digits
  thousandsSeparator: boolean;
}