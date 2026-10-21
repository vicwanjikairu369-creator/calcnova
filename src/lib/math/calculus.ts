import { math, evaluateExpression } from './evaluate';

export interface CalcResult<T = number> {
  ok: boolean;
  value?: T;
  error?: string;
  notes?: string[];
}

/** 5-point central-difference derivative — O(h⁴) accurate. */
export function numericDerivative(f: (x: number) => number, x: number, h = 1e-5): number {
  const y1 = f(x + 2 * h);
  const y2 = f(x + h);
  const y3 = f(x - h);
  const y4 = f(x - 2 * h);
  if (![y1, y2, y3, y4].every(Number.isFinite)) return NaN;
  return (-y1 + 8 * y2 - 8 * y3 + y4) / (12 * h);
}

/** Second derivative via 3-point central difference. */
export function numericSecondDerivative(f: (x: number) => number, x: number, h = 1e-4): number {
  const a = f(x + h);
  const b = f(x);
  const c = f(x - h);
  if (![a, b, c].every(Number.isFinite)) return NaN;
  return (a - 2 * b + c) / (h * h);
}

/** Composite Simpson's rule. n is forced even. */
export function integrateSimpson(
  f: (x: number) => number,
  a: number,
  b: number,
  n = 1000,
): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return 0;
  if (n % 2 === 1) n += 1;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  if (!Number.isFinite(s)) return NaN;
  for (let i = 1; i < n; i++) {
    const v = f(a + i * h);
    if (!Number.isFinite(v)) return NaN;
    s += (i % 2 === 0 ? 2 : 4) * v;
  }
  return (h / 3) * s;
}

export interface IntegrateOutcome {
  value: number;
  iterations: number;
  samples: number;
  converged: boolean;
}

/** Adaptive Simpson — doubles n until successive estimates agree. */
export function integrateAdaptive(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-9,
  maxIter = 14,
): IntegrateOutcome {
  let n = 16;
  let prev = integrateSimpson(f, a, b, n);
  if (!Number.isFinite(prev)) return { value: NaN, iterations: 0, samples: n, converged: false };
  for (let i = 0; i < maxIter; i++) {
    n *= 2;
    const cur = integrateSimpson(f, a, b, n);
    if (!Number.isFinite(cur)) return { value: NaN, iterations: i + 1, samples: n, converged: false };
    if (Math.abs(cur - prev) < tol * (1 + Math.abs(cur))) {
      return { value: cur, iterations: i + 1, samples: n, converged: true };
    }
    prev = cur;
  }
  return { value: prev, iterations: maxIter, samples: n, converged: false };
}

export interface LimitOutcome {
  value: number;
  fromLeft: number;
  fromRight: number;
  agrees: boolean;
}

/** Estimate lim_{x→x0} f(x) by sampling x0 ± h for decreasing h. */
export function numericLimit(f: (x: number) => number, x0: number): LimitOutcome {
  const hs = [1e-2, 1e-3, 1e-4, 1e-5, 1e-6];
  const left = hs.map((h) => f(x0 - h)).filter(Number.isFinite);
  const right = hs.map((h) => f(x0 + h)).filter(Number.isFinite);
  const l = left.length ? left[left.length - 1] : NaN;
  const r = right.length ? right[right.length - 1] : NaN;
  const agrees =
    Number.isFinite(l) && Number.isFinite(r) && Math.abs(l - r) < 1e-5 * (1 + Math.abs(l));
  return { value: agrees ? (l + r) / 2 : NaN, fromLeft: l, fromRight: r, agrees };
}

/**
 * Symbolic derivative via mathjs's expression-tree differentiator.
 * mathjs works in radian convention for trig functions — this is documented in the UI.
 */
export function symbolicDerivative(expr: string, variable = 'x'): CalcResult<string> {
  const trimmed = expr.trim();
  if (!trimmed) return { ok: false, error: 'Empty expression' };
  if (trimmed.length > 500) return { ok: false, error: 'Expression too long' };
  if (!new RegExp(`\\b${variable}\\b`).test(trimmed)) {
    return { ok: true, value: '0', notes: [`Expression does not contain "${variable}".`] };
  }
  try {
    const node = math.derivative(trimmed, variable);
    return { ok: true, value: node.toString({ parenthesis: 'auto', implicit: 'hide' }) };
  } catch (e) {
    return {
      ok: false,
      error: `Symbolic differentiation failed: ${(e as Error).message}. Try the numeric derivative instead.`,
    };
  }
}

/** Build a callable f(x) that returns NaN outside the domain. */
export function makeFunction1D(
  expr: string,
  opts: { angleMode?: 'deg' | 'rad' } = {},
): (x: number) => number {
  return (x: number) => {
    const r = evaluateExpression(expr, { scope: { x }, angleMode: opts.angleMode });
    if (r.ok && typeof r.value === 'number') return r.value;
    if (r.ok && typeof r.value === 'string') {
      const n = Number(r.value);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  };
}