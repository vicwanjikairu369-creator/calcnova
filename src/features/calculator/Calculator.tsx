import { useCallback, useEffect, useRef, useState } from 'react';
import { Delete, Copy, CornerDownLeft, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { evaluateExpression } from '@/lib/math/evaluate';
import { formatNumber } from '@/lib/math/format';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { Toast } from '@/components/ui/Toast';
import { StepsPanel } from '@/components/ui/StepsPanel';

export function Calculator() {
  const { settings, setSettings } = useSettings();
  const { addHistory } = useHistory();
  
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [showSci, setShowSci] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // Memory State
  const [memory, setMemory] = useState<number>(() => {
    try {
      return JSON.parse(localStorage.getItem('calcnova:mem:v1') ?? '{"value":0}').value ?? 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('calcnova:mem:v1', JSON.stringify({ value: memory }));
    } catch { /* ignore */ }
  }, [memory]);

  // Live Preview ("As-you-type")
  useEffect(() => {
    if (!expr.trim()) {
      setPreview('');
      return;
    }
    const timer = setTimeout(() => {
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
      const res = evaluateExpression(sanitized, { angleMode: settings.angleMode });
      if (res.ok && res.value !== expr) {
        setPreview(`= ${formatNumber(res.value, { precision: settings.precision })}`);
      } else {
        setPreview('');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [expr, settings.angleMode, settings.precision]);

  const append = useCallback((token: string) => {
    setError(null);
    setExpr((prev) => {
      if (token === '.') {
        const m = prev.match(/[0-9.]*$/);
        if (m && m[0].includes('.')) return prev;
        if (!m || m[0] === '') return prev + '0.';
      }
      if (/[+\-*/^]$/.test(prev) && /[+\-*/^]$/.test(token)) {
        return prev.slice(0, -1) + token;
      }
      if (prev === '' && /[+*/^]/.test(token)) return token === '-' ? '-' : prev;
      return prev + token;
    });
  }, []);

  const clearAll = () => {
    setExpr('');
    setResult('');
    setError(null);
  };

  const backspace = () => {
    setExpr((p) => p.slice(0, -1));
    setError(null);
  };

  const equals = useCallback(() => {
    if (!expr.trim()) return;
    const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    const res = evaluateExpression(sanitized, { angleMode: settings.angleMode });
    
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
    setExpr(formatted); // Put result back in expr for seamless chaining
    setPreview('');
    setError(null);
    addHistory(sanitized, formatted, 'Calculator');
  }, [expr, settings, addHistory]);

  // Keyboard Support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= '0' && e.key <= '9') {
        append(e.key);
        e.preventDefault();
      } else if (['+', '-', '*', '/', '(', ')', '.', '%', '^'].includes(e.key)) {
        append(e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key);
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === '=') {
        equals();
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        backspace();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        clearAll();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [append, equals]);

  const copy = async () => {
    if (!result && !expr) return;
    try {
      await navigator.clipboard.writeText(result || expr);
      setToast('Copied');
    } catch {
      setToast('Copy failed');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Calculator</h1>
          <p className="text-sm text-navy-500 dark:text-navy-400">
            Unified basic & scientific workspace.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-navy-200 p-0.5 dark:border-navy-700">
          {(['deg', 'rad'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSettings({ angleMode: m })}
              aria-pressed={settings.angleMode === m}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                settings.angleMode === m ? 'bg-violet-600 text-white' : 'text-navy-600 dark:text-navy-300'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="card p-4">
        {/* Display Screen */}
        <div className="rounded-lg bg-navy-50 px-3 py-3 dark:bg-navy-950/60 min-h-[120px] flex flex-col justify-end">
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="e.g. sin(23) + sin(36)"
            aria-label="Expression"
            className="w-full bg-transparent text-right font-mono text-lg text-navy-900 outline-none dark:text-navy-100 placeholder:text-navy-400"
          />
          <div className="mt-1 text-right font-mono text-sm text-navy-400 h-5">
            {preview}
          </div>
          <div className="mt-1 text-right font-mono text-3xl font-semibold text-violet-700 dark:text-violet-300">
            {error ? <span className="text-red-500 text-base">{error}</span> : (result || '\u00A0')}
          </div>
        </div>

        {/* Memory & Toggles */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setMemory(0)} className="btn-soft px-2 py-1 text-xs">MC</button>
            <button onClick={() => append(String(memory))} className="btn-soft px-2 py-1 text-xs">MR</button>
            <button onClick={() => setMemory((m) => m + (result ? Number(result) : 0))} className="btn-soft px-2 py-1 text-xs">M+</button>
            <button onClick={() => setMemory((m) => m - (result ? Number(result) : 0))} className="btn-soft px-2 py-1 text-xs">M−</button>
            <button onClick={() => setMemory(result ? Number(result) : 0)} className="btn-soft px-2 py-1 text-xs">MS</button>
          </div>
          <div className="text-xs text-navy-400 font-mono">M: {formatNumber(memory, { precision: 6 })}</div>
        </div>

        {/* Scientific Drawer Toggle */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowSci(!showSci)}
            className="flex items-center gap-1 text-xs font-medium text-navy-500 hover:text-violet-600 dark:text-navy-400 dark:hover:text-violet-400 transition-colors"
            aria-expanded={showSci}
          >
            {showSci ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showSci ? 'Hide Scientific Functions' : 'Show Scientific Functions'}
          </button>
        </div>

        {/* Scientific Keypad */}
        {showSci && (
          <div className="mt-2 grid grid-cols-5 gap-1.5 border-b border-navy-200 pb-3 dark:border-navy-800">
            {['sin(', 'cos(', 'tan(', 'log10(', 'log('].map((f) => (
              <button key={f} className="key !h-9 text-xs bg-navy-50 dark:bg-navy-900" onClick={() => append(f)}>
                {f.replace('(', '')}
              </button>
            ))}
            {['√(', 'π', 'e', '^', '!'].map((f) => (
              <button key={f} className="key !h-9 text-xs bg-navy-50 dark:bg-navy-900" onClick={() => append(f)}>
                {f.replace('(', '')}
              </button>
            ))}
          </div>
        )}

        {/* Unified Basic Keypad (Always Visible) */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          <button className="key-op" onClick={clearAll}>AC</button>
          <button className="key-op" onClick={() => { setExpr(''); setError(null); }}>CE</button>
          <button className="key-op" onClick={() => append('(')}>(</button>
          <button className="key-op" onClick={() => append(')')}>)</button>

          <button className="key" onClick={() => append('7')}>7</button>
          <button className="key" onClick={() => append('8')}>8</button>
          <button className="key" onClick={() => append('9')}>9</button>
          <button className="key-op" onClick={() => append('÷')}>÷</button>

          <button className="key" onClick={() => append('4')}>4</button>
          <button className="key" onClick={() => append('5')}>5</button>
          <button className="key" onClick={() => append('6')}>6</button>
          <button className="key-op" onClick={() => append('×')}>×</button>

          <button className="key" onClick={() => append('1')}>1</button>
          <button className="key" onClick={() => append('2')}>2</button>
          <button className="key" onClick={() => append('3')}>3</button>
          <button className="key-op" onClick={() => append('-')}>−</button>

          <button className="key" onClick={() => append('.')}>.</button>
          <button className="key" onClick={() => append('0')}>0</button>
          <button className="key" onClick={() => append('%')}>%</button>
          <button className="key-op" onClick={() => append('+')}>+</button>
        </div>

        {/* Bottom Actions */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          <button className="btn-soft col-span-1" onClick={backspace} aria-label="Backspace">
            <Delete className="h-4 w-4" />
          </button>
          <button className="btn-soft col-span-1" onClick={copy} aria-label="Copy">
            <Copy className="h-4 w-4" />
          </button>
          <button className="btn-soft col-span-1" onClick={() => setShowSteps((s) => !s)}>
            Steps
          </button>
          <button className="btn-primary col-span-1" onClick={equals} aria-label="Equals">
            <CornerDownLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showSteps && (
        <div className="card p-4" aria-live="polite">
          <div className="label mb-2">Working</div>
          <StepsPanel expression={expr} angleMode={settings.angleMode} />
        </div>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}