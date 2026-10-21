import { math } from './evaluate';

export interface Solution {
  value: number;
  exact?: string;
}

export interface SolveResult {
  ok: boolean;
  error?: string;
  roots?: Solution[];
  steps?: string[];
  approximate?: boolean;
}

/** Solve ax + b = 0  →  x = -b / a */
export function solveLinear(a: number, b: number): SolveResult {
  if (a === 0) {
    if (b === 0) return { ok: true, roots: [], steps: ['Every x satisfies the equation (0 = 0).'] };
    return { ok: false, error: 'No solution — coefficients produce 0 = b with b ≠ 0.' };
  }
  const x = -b / a;
  return {
    ok: true,
    roots: [{ value: x }],
    steps: [
      `Equation: ${formatCoeff(a)}x + ${formatCoeff(b)} = 0`,
      `Subtract ${formatCoeff(b)} from both sides: ${formatCoeff(a)}x = ${formatCoeff(-b)}`,
      `Divide both sides by ${formatCoeff(a)}: x = ${formatCoeff(-b)} / ${formatCoeff(a)}`,
      `Result: x = ${x}`,
    ],
  };
}

/** Solve ax^2 + bx + c = 0 */
export function solveQuadratic(a: number, b: number, c: number): SolveResult {
  if (a === 0) return solveLinear(b, c);
  const disc = b * b - 4 * a * c;
  const steps: string[] = [
    `Equation: ${formatCoeff(a)}x² + ${formatCoeff(b)}x + ${formatCoeff(c)} = 0`,
    `Discriminant Δ = b² − 4ac = ${formatCoeff(b)}² − 4·${formatCoeff(a)}·${formatCoeff(c)} = ${disc}`,
  ];

  if (disc < 0) {
    const re = -b / (2 * a);
    const im = Math.sqrt(-disc) / (2 * a);
    return {
      ok: true,
      approximate: true,
      roots: [
        { value: re, exact: `${re} + ${im}i` },
        { value: re, exact: `${re} − ${im}i` },
      ],
      steps: [...steps, 'Δ < 0 → complex roots', `x = ${re} ± ${im}i`],
    };
  }
  const sq = Math.sqrt(disc);
  const x1 = (-b + sq) / (2 * a);
  const x2 = (-b - sq) / (2 * a);
  steps.push(
    disc === 0 ? 'Δ = 0 → one repeated real root' : 'Δ > 0 → two distinct real roots',
    `x = (−b ± √Δ) / 2a = (${formatCoeff(-b)} ± ${sq}) / ${formatCoeff(2 * a)}`,
    `x₁ = ${x1}${disc === 0 ? '' : `, x₂ = ${x2}`}`,
  );
  return {
    ok: true,
    roots: disc === 0 ? [{ value: x1 }] : [{ value: x1 }, { value: x2 }],
    steps,
  };
}

/**
 * Solve a system of linear equations given as an augmented matrix [A|b].
 * Uses Gaussian elimination with partial pivoting.
 */
export function solveLinearSystem(A: number[][], b: number[]): SolveResult {
  const n = A.length;
  if (n === 0 || A.some((row) => row.length !== n) || b.length !== n) {
    return { ok: false, error: 'Matrix shape mismatch' };
  }
  const M = A.map((row, i) => [...row, b[i]]);
  const steps: string[] = ['Augmented matrix formed.', 'Applying Gaussian elimination with partial pivoting.'];

  for (let col = 0; col < n; col++) {
    // pivot
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) {
      return { ok: false, error: 'System is singular or has infinitely many solutions.' };
    }
    if (pivot !== col) [M[col], M[pivot]] = [M[pivot], M[col]];

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const roots = M.map((row, i) => ({ value: row[n] / row[i] }));
  steps.push('Back-substitution complete.');
  return { ok: true, roots, steps };
}

export function formatCoeff(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return math.format(n, { precision: 8 }) as string;
}