import { useEffect, useState, useRef } from 'react';
import { Search, Calculator as CalcIcon, ArrowRight } from 'lucide-react';
import { searchTools, TOOLS } from '@/app/tools';
import { evaluateExpression } from '@/lib/math/evaluate';
import { formatNumber } from '@/lib/math/format';

interface Props {
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ onNavigate, isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened, clear query
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 1. Try to evaluate as math
  const evalResult = evaluateExpression(query, { angleMode: 'deg' });
  const isMath = evalResult.ok && typeof evalResult.value === 'number';

  // 2. Search tools
  const toolResults = searchTools(query);

  const handleCopyMath = () => {
    if (isMath && evalResult.ok) {
      navigator.clipboard.writeText(String(evalResult.value));
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-navy-950/50 pt-[10vh] backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl overflow-hidden rounded-xl border border-navy-200 bg-white shadow-2xl dark:border-navy-700 dark:bg-navy-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-navy-200 px-4 dark:border-navy-800">
          <Search className="h-5 w-5 text-navy-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a math problem or search tools..."
            className="flex-1 bg-transparent px-4 py-4 text-lg outline-none placeholder:text-navy-400 dark:text-white"
            aria-label="Global search and calculate"
          />
          <kbd className="hidden sm:inline-block rounded border border-navy-200 px-2 py-0.5 text-xs text-navy-400 dark:border-navy-700">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Math Result */}
          {isMath && (
            <button
              onClick={handleCopyMath}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                <CalcIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-navy-500 truncate">{query}</div>
                <div className="font-mono text-lg font-semibold text-violet-700 dark:text-violet-300 truncate">
                  = {formatNumber(evalResult.value, { precision: 10 })}
                </div>
              </div>
              <span className="text-xs text-navy-400 shrink-0">Click to copy</span>
            </button>
          )}

          {!isMath && query.trim() && (
            <div className="px-3 py-2 text-xs font-medium text-navy-400">No exact math match</div>
          )}

          {/* Tool Results */}
          {toolResults.length > 0 && (
            <div className="mt-2">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                Tools
              </div>
              {toolResults.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { onNavigate(t.id); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-navy-50 dark:hover:bg-navy-800 text-left"
                  >
                    <Icon className="h-4 w-4 text-navy-500 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-navy-700 dark:text-navy-200">
                      {t.name}
                    </span>
                    <ArrowRight className="h-3 w-3 text-navy-300" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isMath && toolResults.length === 0 && query.trim().length > 0 && (
            <div className="px-3 py-8 text-center text-sm text-navy-400">
              No tools found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}