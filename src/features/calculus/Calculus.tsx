import { useMemo, useState, useRef } from 'react';
import { AlertTriangle, Check, Database, Delete } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { useWorkspace } from '@/hooks/useWorkspace';
import { formatNumber } from '@/lib/math/format';
import { math } from '@/lib/math/evaluate';
import {
  makeFunction1D,
  numericDerivative,
  numericSecondDerivative,
  integrateAdaptive,
  numericLimit,
  symbolicDerivative,
} from '@/lib/math/calculus';

type Mode = 'derivative' | 'integral' | 'limit';

export function Calculus() {
  const [mode, setMode] = useState<Mode>('derivative');
  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-32">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Calculus</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Symbolic and numeric derivatives, definite integrals and limits. Results that are
          approximate are labelled.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-lg border border-navy-200 p-1 dark:border-navy-700 w-fit">
        {([
          ['derivative', 'Derivative'],
          ['integral', 'Integral'],
          ['limit', 'Limit'],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${
              mode === m
                ? 'bg-violet-600 text-white'
                : 'text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'derivative' && <DerivativePanel />}
      {mode === 'integral' && <IntegralPanel />}
      {mode === 'limit' && <LimitPanel />}

      <details className="card p-4 text-xs text-navy-500 dark:text-navy-400">
        <summary className="cursor-pointer font-medium text-navy-700 dark:text-navy-200">
          Scope and limitations
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Symbolic derivatives use the mathjs expression-tree differentiator. It supports polynomials, trig, exponential, logarithm, rational functions and their compositions.</li>
          <li>Symbolic differentiation operates in <strong>radian convention</strong> regardless of the angle mode.</li>
          <li>Definite integrals are computed <strong>numerically</strong> (adaptive composite Simpson's rule).</li>
          <li>Limits are estimated by two-sided sampling.</li>
        </ul>
      </details>
    </div>
  );
}

// --- Math Keyboard ---
function CalculusKeyboard({ 
  mode, 
  onInsert, 
  onBackspace 
}: { 
  mode: Mode; 
  onInsert: (val: string) => void; 
  onBackspace: () => void;
}) {
  const baseKeys = ['x', '^', '(', ')', 'pi', 'e', 'sqrt(', '/', '*', '-', '+', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.'];
  const calcKeys = mode === 'derivative' 
    ? ['sin(', 'cos(', 'tan(', 'ln(', 'exp(', 'abs('] 
    : mode === 'integral'
      ? ['sin(', 'cos(', 'exp(']
      : ['sin(', 'cos(', 'exp('];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 border-t border-navy-200 dark:border-navy-800 p-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur-sm md:static md:bg-transparent md:dark:bg-transparent md:border-0 md:shadow-none md:p-0 md:backdrop-blur-none">
      <div className="mx-auto max-w-3xl space-y-1.5">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {calcKeys.map(k => (
            <button key={k} onClick={() => onInsert(k)} className="btn-soft whitespace-nowrap px-2 py-1 text-xs font-mono">
              {k.replace('(', '')}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {baseKeys.map(k => (
            <button key={k} onClick={() => onInsert(k)} className="key !h-8 min-w-[2rem] flex-1 text-sm bg-navy-50 dark:bg-navy-800">
              {k.replace('sqrt(', '√(')}
            </button>
          ))}
          <button onClick={onBackspace} className="key !h-8 min-w-[2rem] flex-1 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <Delete className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Derivative Panel ---
function DerivativePanel() {
  const { settings } = useSettings();
  const { addHistory } = useHistory();
  const [expr, setExpr] = useState('x^2 * sin(x)');
  const [point, setPoint] = useState('2');
  const [order, setOrder] = useState<1 | 2>(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInsert = (val: string) => {
    setExpr(prev => prev + val);
    inputRef.current?.focus();
  };
  const handleBackspace = () => {
    setExpr(prev => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const f = useMemo(() => makeFunction1D(expr, { angleMode: settings.angleMode }), [expr, settings.angleMode]);
  const x0 = Number(point);
  const pointValid = Number.isFinite(x0);

  const sym = useMemo(() => symbolicDerivative(expr, 'x'), [expr]);
  
  // Generate steps for symbolic derivative
  const symSteps = useMemo(() => {
    if (!sym.ok || !expr.trim()) return [];
    try {
      const node = math.parse(expr);
      const dNode = math.derivative(node, 'x');
      // Simple heuristic for displaying steps
      const steps = [
        `Identify the function: f(x) = ${expr}`,
        `Apply differentiation rules (sum, product, chain, etc.)`,
        `Resulting derivative: f'(x) = ${dNode.toString()}`
      ];
      return steps;
    } catch {
      return [];
    }
  }, [expr, sym]);

  const symAt = useMemo(() => {
    if (!sym.ok || !sym.value || !pointValid) return null;
    const g = makeFunction1D(sym.value, { angleMode: 'rad' });
    const v = g(x0);
    return Number.isFinite(v) ? v : null;
  }, [sym, x0, pointValid]);

  const num = useMemo(() => {
    if (!pointValid) return null;
    const v = order === 1 ? numericDerivative(f, x0) : numericSecondDerivative(f, x0);
    return Number.isFinite(v) ? v : null;
  }, [f, x0, order, pointValid]);

  const fmt = (v: number | null) =>
    v === null ? '—' : formatNumber(v, { precision: settings.precision, thousands: settings.thousandsSeparator });

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[2fr,1fr,auto]">
          <label className="space-y-1">
            <span className="label">f(x)</span>
            <input
              ref={inputRef}
              className="input font-mono"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              aria-label="Function of x"
            />
          </label>
          <label className="space-y-1">
            <span className="label">Evaluate at x =</span>
            <input
              className="input font-mono"
              value={point}
              onChange={(e) => setPoint(e.target.value)}
              aria-label="Evaluation point"
            />
          </label>
          <label className="space-y-1">
            <span className="label">Order</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) as 1 | 2)}
            >
              <option value={1}>f′(x)</option>
              <option value={2}>f″(x)</option>
            </select>
          </label>
        </div>

        <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-950/60 space-y-3 text-sm">
          <div>
            <div className="label mb-1">Symbolic Derivative</div>
            <div className="font-mono text-base break-all">
              {sym.ok ? `f′(x) = ${sym.value}` : <span className="text-red-500">{sym.error}</span>}
            </div>
            {symSteps.length > 0 && (
              <div className="mt-3 border-t border-navy-200 dark:border-navy-800 pt-2">
                <div className="text-xs font-semibold text-navy-500 mb-1">Steps:</div>
                <ul className="text-xs text-navy-600 dark:text-navy-300 space-y-1">
                  {symSteps.map((step, i) => <li key={i}>• {step}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-navy-200 pt-3 dark:border-navy-800">
            <div className="label">Values at x = {point || '—'}</div>
            <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-sm">
              <div>
                <span className="text-navy-500 dark:text-navy-400">Symbolic:</span>{' '}
                <strong>{fmt(symAt)}</strong>
              </div>
              <div>
                <span className="text-navy-500 dark:text-navy-400">Numeric:</span>{' '}
                <strong>{fmt(num)}</strong>
              </div>
            </div>
            {symAt !== null && num !== null && Math.abs(symAt - num) > 1e-6 * (1 + Math.abs(symAt)) && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Symbolic and numeric values differ. Check domain limits.
              </p>
            )}
          </div>
        </div>

        <button
          className="btn-soft text-xs"
          onClick={() => addHistory(`d/dx (${expr})`, sym.ok ? sym.value! : 'n/a', 'Calculus')}
        >
          Save to history
        </button>
      </div>
      
      <CalculusKeyboard mode="derivative" onInsert={handleInsert} onBackspace={handleBackspace} />
    </div>
  );
}

// --- Integral Panel ---
function IntegralPanel() {
  const { settings } = useSettings();
  const { addHistory } = useHistory();
  const { setVariable } = useWorkspace();
  const [expr, setExpr] = useState('sin(x)');
  const [a, setA] = useState('0');
  const [b, setB] = useState('pi');
  const [activeInput, setActiveInput] = useState<'expr' | 'a' | 'b'>('expr');
  
  const exprRef = useRef<HTMLInputElement>(null);
  const aRef = useRef<HTMLInputElement>(null);
  const bRef = useRef<HTMLInputElement>(null);

  const handleInsert = (val: string) => {
    if (activeInput === 'expr') setExpr(prev => prev + val);
    else if (activeInput === 'a') setA(prev => prev + val);
    else if (activeInput === 'b') setB(prev => prev + val);
    
    // Refocus
    if (activeInput === 'expr') exprRef.current?.focus();
    else if (activeInput === 'a') aRef.current?.focus();
    else if (activeInput === 'b') bRef.current?.focus();
  };

  const handleBackspace = () => {
    if (activeInput === 'expr') setExpr(prev => prev.slice(0, -1));
    else if (activeInput === 'a') setA(prev => prev.slice(0, -1));
    else if (activeInput === 'b') setB(prev => prev.slice(0, -1));
  };

  const f = useMemo(() => makeFunction1D(expr, { angleMode: settings.angleMode }), [expr, settings.angleMode]);
  const av = Number(a);
  const bv = Number(b);
  const boundsValid = Number.isFinite(av) && Number.isFinite(bv) && av !== bv;

  const outcome = useMemo(
    () => (boundsValid ? integrateAdaptive(f, av, bv) : null),
    [f, av, bv, boundsValid],
  );

  const fmt = (v: number) =>
    formatNumber(v, { precision: settings.precision, thousands: settings.thousandsSeparator });

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="label">f(x)</span>
            <input ref={exprRef} onFocus={() => setActiveInput('expr')} className="input font-mono" value={expr} onChange={(e) => setExpr(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="label">Lower limit a</span>
            <input ref={aRef} onFocus={() => setActiveInput('a')} className="input font-mono" value={a} onChange={(e) => setA(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="label">Upper limit b</span>
            <input ref={bRef} onFocus={() => setActiveInput('b')} className="input font-mono" value={b} onChange={(e) => setB(e.target.value)} />
          </label>
        </div>

        {outcome && Number.isFinite(outcome.value) && (
          <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-950/60 space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <span className="font-mono">∫</span> from {a} to {b} ={' '}
                <strong className="font-mono">{fmt(outcome.value)}</strong>
              </div>
              <button 
                onClick={() => setVariable('integralResult', outcome.value)}
                className="btn-ghost px-2 py-1 text-xs text-violet-600 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900 flex items-center gap-1"
              >
                <Database className="h-3 w-3" /> Save to Workspace
              </button>
            </div>
            
            <div className="border-t border-navy-200 dark:border-navy-800 pt-2">
              <div className="text-xs font-semibold text-navy-500 mb-1">Method Steps (Adaptive Simpson's):</div>
              <ul className="text-xs text-navy-600 dark:text-navy-300 space-y-1">
                <li>1. Evaluate function at bounds: f({av}) and f({bv})</li>
                <li>2. Initial estimate using {(outcome.samples / 2).toLocaleString()} intervals</li>
                <li>3. Double intervals and compare until error tolerance is met</li>
                <li>4. Converged at {(outcome.samples).toLocaleString()} samples</li>
              </ul>
            </div>
          </div>
        )}
        {outcome && !Number.isFinite(outcome.value) && (
          <p className="text-amber-600 dark:text-amber-400 text-sm">
            The integral diverges or is undefined here.
          </p>
        )}
      </div>
      <CalculusKeyboard mode="integral" onInsert={handleInsert} onBackspace={handleBackspace} />
    </div>
  );
}

// --- Limit Panel ---
function LimitPanel() {
  const { settings } = useSettings();
  const [expr, setExpr] = useState('sin(x)/x');
  const [x0Raw, setX0Raw] = useState('0');
  const [activeInput, setActiveInput] = useState<'expr' | 'x0'>('expr');
  
  const exprRef = useRef<HTMLInputElement>(null);
  const x0Ref = useRef<HTMLInputElement>(null);

  const handleInsert = (val: string) => {
    if (activeInput === 'expr') setExpr(prev => prev + val);
    else setX0Raw(prev => prev + val);
    
    if (activeInput === 'expr') exprRef.current?.focus();
    else x0Ref.current?.focus();
  };

  const handleBackspace = () => {
    if (activeInput === 'expr') setExpr(prev => prev.slice(0, -1));
    else setX0Raw(prev => prev.slice(0, -1));
  };

  const f = useMemo(() => makeFunction1D(expr, { angleMode: settings.angleMode }), [expr, settings.angleMode]);
  const x0 = Number(x0Raw);
  const valid = Number.isFinite(x0);
  const outcome = useMemo(() => (valid ? numericLimit(f, x0) : null), [f, x0, valid]);

  const fmt = (v: number) =>
    Number.isFinite(v)
      ? formatNumber(v, { precision: settings.precision, thousands: settings.thousandsSeparator })
      : '—';

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="label">f(x)</span>
            <input ref={exprRef} onFocus={() => setActiveInput('expr')} className="input font-mono" value={expr} onChange={(e) => setExpr(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="label">x →</span>
            <input ref={x0Ref} onFocus={() => setActiveInput('x0')} className="input font-mono" value={x0Raw} onChange={(e) => setX0Raw(e.target.value)} />
          </label>
        </div>

        {outcome && (
          <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-950/60 space-y-2 text-sm font-mono">
            <div className="flex items-center gap-2">
              {outcome.agrees ? (
                <>
                  <Check className="h-4 w-4 text-green-600" aria-hidden />
                  <span>lim<sub>x→{x0Raw}</sub> f(x) ≈ <strong>{fmt(outcome.value)}</strong></span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                  <span>The limit does not appear to exist.</span>
                </>
              )}
            </div>
            <div className="text-xs text-navy-500 dark:text-navy-400 pt-1 border-t border-navy-200 dark:border-navy-800">
              From left: {fmt(outcome.fromLeft)} · From right: {fmt(outcome.fromRight)}
            </div>
          </div>
        )}
      </div>
      <CalculusKeyboard mode="limit" onInsert={handleInsert} onBackspace={handleBackspace} />
    </div>
  );
}