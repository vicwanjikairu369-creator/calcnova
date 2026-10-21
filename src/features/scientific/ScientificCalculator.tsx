import { useCallback, useEffect, useState } from 'react';
import { evaluateExpression } from '@/lib/math/evaluate';
import { formatNumber } from '@/lib/math/format';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { Toast } from '@/components/ui/Toast';
import { StepsPanel } from '@/components/ui/StepsPanel';

const BUTTONS: {
  label: string;
  insert?: string;
  fn?: string;
  kind?: 'op' | 'eq';
}[] = [
  { label: 'sin', fn: 'sin(' },
  { label: 'cos', fn: 'cos(' },
  { label: 'tan', fn: 'tan(' },
  { label: 'asin', fn: 'asin(' },
  { label: 'acos', fn: 'acos(' },
  { label: 'atan', fn: 'atan(' },
  { label: 'ln', fn: 'log(' },
  { label: 'log₁₀', fn: 'log10(' },
  { label: 'logb', fn: 'log(' },
  { label: '√', fn: 'sqrt(' },
  { label: '∛', fn: 'cbrt(' },
  { label: 'nth√', fn: 'nthRoot(' },
  { label: 'x²', insert: '^2' },
  { label: 'xʸ', insert: '^' },
  { label: '|x|', fn: 'abs(' },
  { label: 'π', insert: 'pi' },
  { label: 'e', insert: 'e' },
  { label: '!', insert: '!' },
  { label: 'nPr', fn: 'permutations(' },
  { label: 'nCr', fn: 'combinations(' },
  { label: 'mod', insert: ' mod ' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: 'E', insert: 'e' },
  { label: '7', insert: '7' },
  { label: '8', insert: '8' },
  { label: '9', insert: '9' },
  { label: '4', insert: '4' },
  { label: '5', insert: '5' },
  { label: '6', insert: '6' },
  { label: '1', insert: '1' },
  { label: '2', insert: '2' },
  { label: '3', insert: '3' },
  { label: '0', insert: '0' },
  { label: '.', insert: '.' },
  { label: 'C', kind: 'op' },
];

export function ScientificCalculator() {
  const { settings, setSettings } = useSettings();
  const { addHistory } = useHistory();
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const append = (t: string) => {
    setError(null);
    setExpr((p) => p + t);
  };
  const clear = () => {
    setExpr('');
    setResult('');
    setError(null);
  };
  const back = () => {
    setExpr((p) => p.slice(0, -1));
    setError(null);
  };

  const equals = useCallback(() => {
    if (!expr.trim()) return;
    const res = evaluateExpression(expr, { angleMode: settings.angleMode });
    if (!res.ok) {
      setError(res.error);
      setResult('');
      return;
    }
    const formatted = formatNumber(res.value, {
      precision: settings.precision,
      thousands: settings.thousandsSeparator,
    });
    setResult(formatted);
    setError(null);
    addHistory(expr, formatted, 'Scientific');
  }, [expr, settings, addHistory]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.key === '=') {
        equals();
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        back();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        clear();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [equals]);

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setToast('Copied');
    } catch {
      setToast('Copy failed');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Scientific calculator</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Full trigonometric, logarithmic and combinatorial functions.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-navy-200 p-0.5 dark:border-navy-700">
          {(['deg', 'rad'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSettings({ angleMode: m })}
              aria-pressed={settings.angleMode === m}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                settings.angleMode === m
                  ? 'bg-violet-600 text-white'
                  : 'text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="rounded-lg bg-navy-50 px-3 py-3 dark:bg-navy-950/60">
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="e.g. sin(30) + log10(1000)"
            aria-label="Expression"
            className="w-full bg-transparent text-right font-mono text-lg text-navy-900 outline-none dark:text-navy-100"
          />
          <div className="mt-1 min-h-[2rem] break-all text-right font-mono text-3xl font-semibold text-violet-700 dark:text-violet-300">
            {error ? <span className="text-red-500 text-base">{error}</span> : result || '\u00A0'}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-6">
          {BUTTONS.map((b, i) => (
            <button
              key={i}
              className={b.kind === 'op' ? 'key-op !h-10 text-sm' : 'key !h-10 text-sm'}
              onClick={() => {
                if (b.kind === 'op') clear();
                else if (b.fn) append(b.fn);
                else if (b.insert) append(b.insert);
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          <button className="btn-soft" onClick={back}>
            ⌫ Back
          </button>
          <button className="btn-soft" onClick={clear}>
            Clear
          </button>
          <button className="btn-soft" onClick={copy}>
            Copy
          </button>
          <button
            className="btn-soft"
            onClick={() => setShowSteps((s) => !s)}
            aria-expanded={showSteps}
            aria-controls="sci-steps"
          >
            {showSteps ? 'Hide' : 'Steps'}
          </button>
          <button className="btn-primary" onClick={equals}>
            =
          </button>
        </div>
      </div>

      {showSteps && (
        <div id="sci-steps" className="card p-4" aria-live="polite">
          <div className="label mb-2">Working</div>
          <StepsPanel expression={expr} angleMode={settings.angleMode} />
        </div>
      )}

      <div className="text-xs text-navy-400 space-y-1">
        <p>
          Supports: sin, cos, tan, asin, acos, atan, log, log10, sqrt, cbrt, nthRoot, abs,
          permutations, combinations, mod, factorial (!), pi, e.
        </p>
        <p>Complex results appear where supported (e.g. sqrt(-1) → i).</p>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}