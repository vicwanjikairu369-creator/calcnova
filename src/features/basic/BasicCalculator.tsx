import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Delete, Copy, RotateCcw, CornerDownLeft } from 'lucide-react';
import { evaluateExpression } from '@/lib/math/evaluate';
import { formatNumber } from '@/lib/math/format';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { Toast } from '@/components/ui/Toast';
import { StepsPanel } from '@/components/ui/StepsPanel';

const MEM_KEY = 'calcnova:mem:v1';

interface MemState {
  value: number;
}

export function BasicCalculator() {
  const { settings } = useSettings();
  const { addHistory } = useHistory();
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [memory, setMemory] = useState<number>(() => {
    try {
      return JSON.parse(localStorage.getItem(MEM_KEY) ?? '{"value":0}').value ?? 0;
    } catch {
      return 0;
    }
  });
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(MEM_KEY, JSON.stringify({ value: memory } as MemState));
    } catch {
      /* ignore */
    }
  }, [memory]);

  const append = useCallback((token: string) => {
    setError(null);
    setExpr((prev) => {
      if (token === '.') {
        const m = prev.match(/[0-9.]*$/);
        if (m && m[0].includes('.')) return prev;
        if (!m || m[0] === '') return prev + '0.';
      }
      if (/[+\-*/]$/.test(prev) && /[+\-*/]$/.test(token)) {
        return prev.slice(0, -1) + token;
      }
      if (prev === '' && /[+*/]/.test(token)) return token === '-' ? '-' : prev;
      return prev + token;
    });
  }, []);

  const clearAll = () => {
    setExpr('');
    setResult('');
    setError(null);
  };
  const clearEntry = () => {
    setExpr('');
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
    setError(null);
    addHistory(sanitized, formatted, 'Basic');
  }, [expr, settings.angleMode, settings.precision, settings.thousandsSeparator, addHistory]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= '0' && e.key <= '9') {
        append(e.key);
        e.preventDefault();
      } else if (['+', '-', '*', '/', '(', ')', '.', '%'].includes(e.key)) {
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

  const toggleSign = () => {
    setExpr((p) => {
      if (!p) return '-';
      const m = p.match(/(-?\d*\.?\d+)$/);
      if (!m) return p + '-';
      const num = m[1];
      const start = p.length - num.length;
      return p.slice(0, start) + (num.startsWith('-') ? num.slice(1) : '-' + num);
    });
  };

  const percent = () => append('%');

  const copy = async () => {
    const text = result || expr;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast('Copied');
    } catch {
      setToast('Copy failed');
    }
  };

  const memButtons = useMemo(
    () => [
      { label: 'MC', action: () => setMemory(0) },
      { label: 'MR', action: () => append(String(memory)) },
      {
        label: 'M+',
        action: () => setMemory((m) => m + (result ? Number(result) : 0)),
      },
      {
        label: 'M−',
        action: () => setMemory((m) => m - (result ? Number(result) : 0)),
      },
      { label: 'MS', action: () => setMemory(result ? Number(result) : 0) },
    ],
    [memory, result, append],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Basic calculator</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Standard arithmetic with memory and full keyboard support.
        </p>
      </header>

      <div className="card p-4">
        <div
          ref={inputRef}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="rounded-lg bg-navy-50 px-3 py-3 dark:bg-navy-950/60"
        >
          <div className="min-h-[1.5rem] break-all text-right font-mono text-lg text-navy-900 dark:text-navy-100">
            {expr || '\u00A0'}
          </div>
          <div className="mt-1 min-h-[2rem] break-all text-right font-mono text-3xl font-semibold text-violet-700 dark:text-violet-300">
            {error ? <span className="text-red-500 text-base">{error}</span> : result || '\u00A0'}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {memButtons.map((b) => (
            <button key={b.label} onClick={b.action} className="btn-soft px-2.5 py-1 text-xs">
              {b.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-navy-400 self-center">
            Memory: {formatNumber(memory, { precision: 8 })}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <button className="key-op" onClick={clearAll}>
            AC
          </button>
          <button className="key-op" onClick={clearEntry}>
            CE
          </button>
          <button className="key-op" onClick={percent}>
            %
          </button>
          <button className="key-op" onClick={() => append('÷')}>
            ÷
          </button>

          <button className="key" onClick={() => append('7')}>
            7
          </button>
          <button className="key" onClick={() => append('8')}>
            8
          </button>
          <button className="key" onClick={() => append('9')}>
            9
          </button>
          <button className="key-op" onClick={() => append('×')}>
            ×
          </button>

          <button className="key" onClick={() => append('4')}>
            4
          </button>
          <button className="key" onClick={() => append('5')}>
            5
          </button>
          <button className="key" onClick={() => append('6')}>
            6
          </button>
          <button className="key-op" onClick={() => append('-')}>
            −
          </button>

          <button className="key" onClick={() => append('1')}>
            1
          </button>
          <button className="key" onClick={() => append('2')}>
            2
          </button>
          <button className="key" onClick={() => append('3')}>
            3
          </button>
          <button className="key-op" onClick={() => append('+')}>
            +
          </button>

          <button className="key" onClick={toggleSign}>
            ±
          </button>
          <button className="key" onClick={() => append('0')}>
            0
          </button>
          <button className="key" onClick={() => append('.')}>
            .
          </button>
          <button className="key-eq" onClick={equals} aria-label="Equals">
            <CornerDownLeft className="h-4 w-4" aria-hidden />
          </button>

          <button className="key col-span-2" onClick={() => append('(')}>
            (
          </button>
          <button className="key col-span-2" onClick={() => append(')')}>
            )
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="btn-soft flex-1" onClick={backspace}>
            <Delete className="h-4 w-4" aria-hidden /> Backspace
          </button>
          <button
            className="btn-soft flex-1"
            onClick={() => {
              setExpr(result || '');
              setResult('');
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Use result
          </button>
          <button className="btn-soft" onClick={copy} aria-label="Copy result">
            <Copy className="h-4 w-4" aria-hidden /> Copy
          </button>
          <button
            className="btn-soft"
            onClick={() => setShowSteps((s) => !s)}
            aria-expanded={showSteps}
            aria-controls="basic-steps"
          >
            {showSteps ? 'Hide steps' : 'Show steps'}
          </button>
        </div>
      </div>

      {showSteps && (
        <div id="basic-steps" className="card p-4" aria-live="polite">
          <div className="label mb-2">Working</div>
          <StepsPanel expression={expr} angleMode={settings.angleMode} />
        </div>
      )}

      <p className="text-xs text-navy-400">
        Shortcuts: digits, + − * /, Enter (=), Backspace, Esc (AC).
      </p>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}