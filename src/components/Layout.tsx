import { useOnline } from '@/hooks/useOnline';
import { WifiOff } from 'lucide-react';

function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      You are offline. All calculator features continue to work — history, settings and notebooks
      are stored on this device. Online-only features are unavailable.
    </div>
  );
}

import { type ReactNode } from 'react';
import { Menu, X, Search, Moon, Sun, Monitor } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { TOOLS, CATEGORIES_NAV } from '@/app/tools';
import { CalcNovaLogo } from './Logo';

interface LayoutProps {
  currentTool: string;
  onNavigate: (id: string) => void;
  onSearch: (q: string) => void;
  children: ReactNode;
}

export function Layout({ currentTool, onNavigate, onSearch, children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const { settings, setSettings } = useSettings();
  const [q, setQ] = useState('');

  const toggleTheme = () => {
    const next = settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'system' : 'dark';
    setSettings({ theme: next });
  };
  const ThemeIcon = settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Monitor;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(q);
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900">
        <div className="p-5">
          <CalcNovaLogo />
        </div>
        <form onSubmit={submitSearch} className="px-3 pb-3" role="search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search calculators…"
              aria-label="Search calculators"
              className="input pl-9"
            />
          </div>
        </form>
        <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Calculators">
          {CATEGORIES_NAV.map((cat) => (
            <div key={cat.id} className="mb-4">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                {cat.name}
              </div>
              <ul>
                {cat.toolIds.map((id) => {
                  const tool = TOOLS[id];
                  if (!tool) return null;
                  const Icon = tool.icon;
                  const active = currentTool === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(id)}
                        aria-current={active ? 'page' : undefined}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                            : 'text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">{tool.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-navy-200 p-3 dark:border-navy-800">
          <button onClick={toggleTheme} className="btn-ghost w-full justify-start" aria-label="Toggle theme">
            <ThemeIcon className="h-4 w-4" aria-hidden />
            Theme: {settings.theme}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-navy-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-navy-800 dark:bg-navy-900/90 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="btn-ghost -ml-2"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <CalcNovaLogo compact />
          <button onClick={toggleTheme} className="btn-ghost ml-auto" aria-label="Toggle theme">
            <ThemeIcon className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] overflow-y-auto bg-white p-4 shadow-xl dark:bg-navy-900">
              <div className="mb-4 flex items-center justify-between">
                <CalcNovaLogo />
                <button onClick={() => setOpen(false)} className="btn-ghost" aria-label="Close menu">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <form onSubmit={(e) => { submitSearch(e); setOpen(false); }} className="pb-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search calculators…"
                  aria-label="Search calculators"
                  className="input"
                />
              </form>
              <nav aria-label="Calculators">
                {CATEGORIES_NAV.map((cat) => (
                  <div key={cat.id} className="mb-3">
                    <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                      {cat.name}
                    </div>
                    <ul>
                      {cat.toolIds.map((id) => {
                        const tool = TOOLS[id];
                        if (!tool) return null;
                        const Icon = tool.icon;
                        const active = currentTool === id;
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              onClick={() => { onNavigate(id); setOpen(false); }}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm ${
                                active
                                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                                  : 'text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-800'
                              }`}
                            >
                              <Icon className="h-4 w-4" aria-hidden />
                              {tool.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8">        <OfflineBanner />{children}</main>
        <footer className="border-t border-navy-200 px-4 py-4 text-xs text-navy-500 dark:border-navy-800 md:px-8">
          CalcNova · One platform. Every calculation. Data is stored locally on this device only.
        </footer>
      </div>
    </div>
  );
}