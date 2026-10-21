import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '@/lib/math/evaluate';
import { solveLinear, solveQuadratic } from '@/lib/math/solvers';
import { CATEGORIES, convert } from '@/lib/units';

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v));

describe('evaluateExpression', () => {
  it('2 + 3 = 5', () => {
    const r = evaluateExpression('2 + 3');
    expect(r.ok).toBe(true);
    expect(num((r as any).value)).toBe(5);
  });
  it('7 × 8 = 56', () => {
    const r = evaluateExpression('7 * 8');
    expect(r.ok).toBe(true);
    expect(num((r as any).value)).toBe(56);
  });
  it('15% of 2400 = 360', () => {
    const r = evaluateExpression('(15/100)*2400');
    expect(r.ok).toBe(true);
    expect(num((r as any).value)).toBe(360);
  });
  it('(2 + 3) × 4 = 20', () => {
    const r = evaluateExpression('(2 + 3) * 4');
    expect(r.ok).toBe(true);
    expect(num((r as any).value)).toBe(20);
  });
  it('sqrt(81) = 9', () => {
    const r = evaluateExpression('sqrt(81)');
    expect(r.ok).toBe(true);
    expect(num((r as any).value)).toBe(9);
  });
  it('log10(1000) = 3', () => {
    const r = evaluateExpression('log10(1000)');
    expect(r.ok).toBe(true);
    expect(num((r as any).value)).toBeCloseTo(3, 10);
  });
  it('sin(30 deg) ≈ 0.5', () => {
    const r = evaluateExpression('sin(30)', { angleMode: 'deg' });
    expect(r.ok).toBe(true);
    expect(num((r as any).value)).toBeCloseTo(0.5, 10);
  });
  it('division by zero errors cleanly', () => {
    const r = evaluateExpression('1/0');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/infinite|division/i);
  });
  it('malformed input does not crash', () => {
    const r = evaluateExpression('2 +* 3');
    expect(r.ok).toBe(false);
  });
  it('blocks eval-like identifiers', () => {
    const r = evaluateExpression('eval("1")');
    expect(r.ok).toBe(false);
  });
});

describe('solvers', () => {
  it('2x + 5 = 17 → x = 6', () => {
    const r = solveLinear(2, -12);
    expect(r.ok).toBe(true);
    expect(r.roots?.[0].value).toBeCloseTo(6, 10);
  });
  it('x² − 5x + 6 = 0 → roots 2 and 3', () => {
    const r = solveQuadratic(1, -5, 6);
    expect(r.ok).toBe(true);
    const vals = r.roots!.map((x) => x.value).sort((a, b) => a - b);
    expect(vals[0]).toBeCloseTo(2, 10);
    expect(vals[1]).toBeCloseTo(3, 10);
  });
  it('linear with a = 0 and b = 0 → no unique root', () => {
    const r = solveLinear(0, 0);
    expect(r.ok).toBe(true);
    expect(r.roots).toEqual([]);
  });
  it('linear with a = 0 and b ≠ 0 → error', () => {
    const r = solveLinear(0, 5);
    expect(r.ok).toBe(false);
  });
});

describe('unit conversion', () => {
  const length = CATEGORIES.find((c) => c.id === 'length')!;
  const temp = CATEGORIES.find((c) => c.id === 'temperature')!;
  it('1 km = 1000 m', () => {
    expect(convert(1, 'km', 'm', length)).toBe(1000);
  });
  it('0 °C = 32 °F', () => {
    expect(convert(0, 'c', 'f', temp)).toBeCloseTo(32, 10);
  });
  it('100 °C = 212 °F', () => {
    expect(convert(100, 'c', 'f', temp)).toBeCloseTo(212, 10);
  });
  it('1 GiB = 1024 MiB', () => {
    const data = CATEGORIES.find((c) => c.id === 'data')!;
    expect(convert(1, 'gib', 'mib', data)).toBeCloseTo(1024, 10);
  });
});

describe('compound interest reference', () => {
  it('1000 at 5% for 10y compounded monthly ≈ 1647.009', () => {
    const amount = 1000 * Math.pow(1 + 0.05 / 12, 12 * 10);
    expect(amount).toBeCloseTo(1647.009, 2);
  });
});