import { useMemo, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { formatNumber } from '@/lib/math/format';
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
    <div className="mx-auto max-w-3xl space-y-4">
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
          <li>Symbolic derivatives use the mathjs expression-tree differentiator. It supports polynomials, trig, exponential, logarithm, rational functions and their compositions. It does not differentiate <code>abs</code> at 0, piecewise expressions, or arbitrary user-defined functions.</li>
          <li>Symbolic differentiation operates in <strong>radian convention</strong> regardless of the angle mode — this matches standard mathematical notation.</li>
          <li>Definite integrals are computed <strong>numerically</strong> (adaptive composite Simpson's rule). There is no symbolic antiderivative.</li>
          <li>Integrals with singularities inside the interval (e.g. 1/x over [−1, 1]) are reported as diverging rather than silently returning a Cauchy principal value.</li>
          <li>Limits are estimated by two-sided sampling. When the left and right limits disagree, the result is reported as not existing.</li>
        </ul>
      </details>
    </div>
  );
}

function DerivativePanel() {
  const { settings } = useSettings();
  const { addHistory } = useHistory();
  const [expr, setExpr] = useState('x^2 * sin(x)');
  const [point, setPoint] = useState('2');
  const [order, setOrder] = useState<1 | 2>(1);

  const f = useMemo(() => makeFunction1D(expr, { angleMode: settings.angleMode }), [expr, settings.angleMode]);
  const x0 = Number(point);
  const pointValid = Number.isFinite(x0);

  const sym = useMemo(() => symbolicDerivative(expr, 'x'), [expr]);
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
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[2fr,1fr,auto]">
        <label className="space-y-1">
          <span className="label">f(x)</span>
          <input
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

      <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-950/60 space-y-2 text-sm">
        <div>
          <div className="label">Symbolic derivative</div>
          <div className="mt-1 font-mono text-base break-all">
            {sym.ok ? `f′(x) = ${sym.value}` : <span className="text-red-500">{sym.error}</span>}
          </div>
          {sym.notes?.map((n, i) => (
            <p key={i} className="mt-1 text-xs text-navy-500 dark:text-navy-400">{n}</p>
          ))}
          <p className="mt-1 text-[11px] text-navy-400">Computed in radian convention.</p>
        </div>

        <div className="border-t border-navy-200 pt-2 dark:border-navy-800">
          <div className="label">Values at x = {point || '—'}</div>
          <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-sm">
            <div>
              <span className="text-navy-500 dark:text-navy-400">Symbolic f({order === 1 ? '′' : '″'}):</span>{' '}
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
              Symbolic and numeric values differ. This usually means the symbolic derivative is not
              valid at this point (e.g. a domain edge or a point where the numeric method is
              unstable).
            </p>
          )}
        </div>
      </div>

      <button
        className="btn-soft text-xs"
        onClick={() =>
          addHistory(`d/dx (${expr})`, sym.ok ? sym.value! : 'n/a', 'Calculus')
        }
      >
        Save symbolic derivative to history
      </button>
    </div>
  );
}

function IntegralPanel() {
  const { settings } = useSettings();
  const { addHistory } = useHistory();
  const [expr, setExpr] = useState('sin(x)');
  const [a, setA] = useState('0');
  const [b, setB] = useState('pi');

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
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="label">f(x)</span>
          <input className="input font-mono" value={expr} onChange={(e) => setExpr(e.target.value)} aria-label="Integrand" />
        </label>
        <label className="space-y-1">
          <span className="label">Lower limit a</span>
          <input className="input font-mono" value={a} onChange={(e) => setA(e.target.value)} aria-label="Lower limit" />
        </label>
        <label className="space-y-1">
          <span className="label">Upper limit b</span>
          <input className="input font-mono" value={b} onChange={(e) => setB(e.target.value)} aria-label="Upper limit" />
        </label>
      </div>

      {!boundsValid && (
        <p className="text-sm text-red-500">Enter valid distinct numeric bounds. Constants like <code>pi</code> and <code>e</code> are accepted.</p>
      )}

      {outcome && (
        <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-950/60 space-y-1 text-sm">
          {Number.isFinite(outcome.value) ? (
            <>
              <div>
                <span className="font-mono">∫</span> from {a} to {b} ={' '}
                <strong className="font-mono">{fmt(outcome.value)}</strong>
              </div>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Numeric result (adaptive Simpson, {(outcome.samples).toLocaleString()} samples).{' '}
                {outcome.converged
                  ? 'Estimate converged to the requested tolerance.'
                  : 'Tolerance not reached — value may be inaccurate; the integrand may be poorly behaved in this interval.'}
              </p>
            </>
          ) : (
            <p className="text-amber-600 dark:text-amber-400">
              The integrand is not finite everywhere on [{a}, {b}], so the integral diverges or is
              undefined here. Integration does not use a Cauchy principal value.
            </p>
          )}
        </div>
      )}

      <button
        className="btn-soft text-xs"
        disabled={!outcome || !Number.isFinite(outcome.value)}
        onClick={() =>
          outcome &&
          addHistory(`∫ (${expr}) dx from ${a} to ${b}`, fmt(outcome.value), 'Calculus')
        }
      >
        Save to history
      </button>
    </div>
  );
}

function LimitPanel() {
  const { settings } = useSettings();
  const [expr, setExpr] = useState('sin(x)/x');
  const [x0Raw, setX0Raw] = useState('0');

  const f = useMemo(() => makeFunction1D(expr, { angleMode: settings.angleMode }), [expr, settings.angleMode]);
  const x0 = Number(x0Raw);
  const valid = Number.isFinite(x0);
  const outcome = useMemo(() => (valid ? numericLimit(f, x0) : null), [f, x0, valid]);

  const fmt = (v: number) =>
    Number.isFinite(v)
      ? formatNumber(v, { precision: settings.precision, thousands: settings.thousandsSeparator })
      : '—';

  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="label">f(x)</span>
          <input className="input font-mono" value={expr} onChange={(e) => setExpr(e.target.value)} aria-label="Function" />
        </label>
        <label className="space-y-1">
          <span className="label">x →</span>
          <input className="input font-mono" value={x0Raw} onChange={(e) => setX0Raw(e.target.value)} aria-label="Approach point" />
        </label>
      </div>

      {outcome && (
        <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-950/60 space-y-1 text-sm font-mono">
          <div className="flex items-center gap-2">
            {outcome.agrees ? (
              <>
                <Check className="h-4 w-4 text-green-600" aria-hidden />
                <span>
                  lim<sub>x→{x0Raw}</sub> f(x) ≈ <strong>{fmt(outcome.value)}</strong>
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                <span>The limit does not appear to exist at this point.</span>
              </>
            )}
          </div>
          <div className="text-xs text-navy-500 dark:text-navy-400 pt-1">
            From left: {fmt(outcome.fromLeft)} · From right: {fmt(outcome.fromRight)}
          </div>
          <p className="text-[11px] text-navy-400 pt-1">
            Numeric estimate. A finite, matching pair of one-sided samples does not constitute a
            proof of the limit.
          </p>
        </div>
      )}
    </div>
  );
}