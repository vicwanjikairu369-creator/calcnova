import {
  Calculator,
  FlaskConical,
  LineChart,
  Sigma,
  FunctionSquare,
  Landmark,
  ArrowRightLeft,
  BarChart3,
  Binary,
  Wrench,
  BookOpen,
  Sparkles,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  keywords?: string[];
}

export const TOOLS: Record<string, ToolMeta> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Everyday arithmetic with memory and keyboard input.',
    icon: Calculator,
    category: 'Math',
    keywords: ['arithmetic', 'add', 'multiply', 'subtract', 'divide'],
  },
  scientific: {
    id: 'scientific',
    name: 'Scientific',
    description: 'Trigonometry, logarithms, powers and constants.',
    icon: FlaskConical,
    category: 'Math',
    keywords: ['trig', 'log', 'sin', 'cos', 'tan', 'ln', 'factorial'],
  },
  graphing: {
    id: 'graphing',
    name: 'Graphing',
    description: 'Plot multiple equations with zoom and pan.',
    icon: LineChart,
    category: 'Math',
    keywords: ['plot', 'function', 'chart', 'graph', 'curve'],
  },
  equations: {
    id: 'equations',
    name: 'Equation solver',
    description: 'Linear, quadratic, polynomial and linear systems.',
    icon: Sigma,
    category: 'Math',
    keywords: ['solve', 'root', 'quadratic', 'linear', 'system'],
  },
  calculus: {
    id: 'calculus',
    name: 'Calculus',
    description: 'Derivatives, definite integrals and limits.',
    icon: FunctionSquare,
    category: 'Math',
    keywords: ['derivative', 'integral', 'limit', 'differentiate', 'integrate', 'd/dx'],
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Interest, loans, amortisation and margins.',
    icon: Landmark,
    category: 'Tools',
    keywords: ['loan', 'interest', 'mortgage', 'vat', 'margin', 'compound'],
  },
  converter: {
    id: 'converter',
    name: 'Unit converter',
    description: 'Length, mass, temperature, data and more.',
    icon: ArrowRightLeft,
    category: 'Tools',
    keywords: ['convert', 'units', 'length', 'mass', 'temperature', 'data'],
  },
  stats: {
    id: 'stats',
    name: 'Statistics',
    description: 'Mean, median, spread and linear regression.',
    icon: BarChart3,
    category: 'Tools',
    keywords: ['mean', 'median', 'regression', 'variance', 'stddev', 'mode'],
  },
  programmer: {
    id: 'programmer',
    name: 'Programmer',
    description: 'Base conversion and bitwise operations.',
    icon: Binary,
    category: 'Tools',
    keywords: ['hex', 'binary', 'bitwise', 'octal', 'decimal'],
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    description: 'Dates, BMI, ratios, GCD/LCM, matrices.',
    icon: Wrench,
    category: 'Tools',
    keywords: ['date', 'bmi', 'matrix', 'percentage', 'gcd', 'lcm'],
  },
  history: {
    id: 'history',
    name: 'History & notebook',
    description: 'Recent calculations and saved notes.',
    icon: BookOpen,
    category: 'Workspace',
    keywords: ['history', 'notes', 'saved'],
  },
  assistant: {
    id: 'assistant',
    name: 'Math assistant',
    description: 'Ask maths questions in plain language.',
    icon: Sparkles,
    category: 'Workspace',
    keywords: ['ai', 'assistant', 'ask', 'natural language', 'help'],
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    description: 'Theme, precision and angle mode.',
    icon: SettingsIcon,
    category: 'Workspace',
    keywords: ['theme', 'preferences', 'precision', 'angle'],
  },
};

export const CATEGORIES_NAV: { id: string; name: string; toolIds: string[] }[] = [
  {
    id: 'math',
    name: 'Mathematics',
    toolIds: ['basic', 'scientific', 'graphing', 'equations', 'calculus'],
  },
  {
    id: 'tools',
    name: 'Tools',
    toolIds: ['finance', 'converter', 'stats', 'programmer', 'utilities'],
  },
  {
    id: 'workspace',
    name: 'Workspace',
    toolIds: ['history', 'assistant', 'settings'],
  },
];

export function searchTools(q: string): ToolMeta[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return Object.values(TOOLS).filter((t) => {
    const hay = [t.name, t.description, t.category, ...(t.keywords ?? [])]
      .join(' ')
      .toLowerCase();
    return hay.includes(s);
  });
}