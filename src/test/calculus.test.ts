import { describe, it, expect } from 'vitest';
import {
  numericDerivative,
  numericSecondDerivative,
  integrateSimpson,
  integrateAdaptive,
  numericLimit,
  symbolicDerivative,
  makeFunction1D,
} from '@/lib/math/calculus';

const rad = (expr: string) => makeFunction1D(expr, { angleMode: 'rad' });

describe('numericDerivative', () => {
  it('d/dx x² at x=3 is 6', () => {
    expect(numericDerivative((x) => x * x, 3)).toBeCloseTo(6, 6);
  });
  it('d/dx sin(x) at x=0 is 1 (radians)', () => {
    expect(numericDerivative((x) => Math.sin(x), 0)).toBeCloseTo(1, 6);
  });
  it('returns NaN outside domain', () => {
    expect(numericDerivative((x) => Math.sqrt(x), -1)).toBeNaN();
  });
});

describe('numericSecondDerivative', () => {
  it('d²/dx² x² is 2', () => {
    expect(numericSecondDerivative((x) => x * x, 5)).toBeCloseTo(2, 4);
  });
});

describe('integration', () => {
  it('∫₀¹ x² dx = 1/3', () => {
    expect(integrateSimpson((x) => x * x, 0, 1, 1000)).toBeCloseTo(1 / 3, 8);
  });
  it('∫₀^π sin(x) dx = 2', () => {
    expect(integrateSimpson(Math.sin, 0, Math.PI, 2000)).toBeCloseTo(2, 8);
  });
  it('adaptive Simpson converges on a smooth integrand', () => {
    const out = integrateAdaptive(rad('sin(x)'), 0, Math.PI);
    expect(out.converged).toBe(true);
    expect(out.value).toBeCloseTo(2, 8);
  });
  it('reports divergence for a singular integrand', () => {
    const out = integrateAdaptive((x) => 1 / x, -1, 1);
    expect(Number.isFinite(out.value)).toBe(false);
  });
});

describe('limits', () => {
  it('lim sin(x)/x as x→0 = 1', () => {
    const out = numericLimit(rad('sin(x)/x'), 0);
    expect(out.agrees).toBe(true);
    expect(out.value).toBeCloseTo(1, 5);
  });
  it('step function has no limit at the jump', () => {
    const out = numericLimit((x) => (x < 0 ? -1 : 1), 0);
    expect(out.agrees).toBe(false);
  });
});

describe('symbolicDerivative', () => {
  it('differentiates x² to 2x', () => {
    const r = symbolicDerivative('x^2', 'x');
    expect(r.ok).toBe(true);
    const f = rad(r.value!);
    expect(f(3)).toBeCloseTo(6, 8);
  });
  it('product rule: x²·sin(x)', () => {
    const r = symbolicDerivative('x^2 * sin(x)', 'x');
    expect(r.ok).toBe(true);
    // d/dx = 2x sin(x) + x² cos(x). At x=1 → 2 sin1 + cos1 ≈ 2.2226
    const f = rad(r.value!);
    expect(f(1)).toBeCloseTo(2 * Math.sin(1) + Math.cos(1), 6);
  });
  it('constant function has zero derivative', () => {
    const r = symbolicDerivative('7', 'x');
    expect(r.ok).toBe(true);
    expect(r.value).toBe('0');
  });
  it('fails cleanly on unsupported input', () => {
    const r = symbolicDerivative('nthRoot(x, 3)', 'x');
    // Either succeeds (newer mathjs) or fails with a clear message — must not throw.
    expect(typeof r.ok).toBe('boolean');
    if (!r.ok) expect(r.error).toBeTruthy();
  });
});