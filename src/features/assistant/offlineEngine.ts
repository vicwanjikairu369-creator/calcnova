import { evaluateExpression } from '@/lib/math/evaluate';
import { symbolicDerivative, integrateAdaptive, makeFunction1D } from '@/lib/math/calculus';
import { solveLinear, solveQuadratic } from '@/lib/math/solvers';
import { CATEGORIES, convert } from '@/lib/units';
import { formatNumber } from '@/lib/math/format';

export interface AssistantReply {
  kind: 'answer' | 'unsupported' | 'error';
  text: string;
  details?: string[];
  tool?: string;
}

function cleanExpr(s: string): string {
  return s
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .trim();
}

function computeStat(op: string, xs: number[]): number | null {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance =
    xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length > 1 ? xs.length - 1 : 1);
  switch (op) {
    case 'mean':
    case 'average':
      return mean;
    case 'median': {
      const s = [...xs].sort((a, b) => a - b);
      return s.length % 2
        ? s[(s.length - 1) / 2]
        : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    }
    case 'mode': {
      const c = new Map<number, number>();
      xs.forEach((v) => c.set(v, (c.get(v) ?? 0) + 1));
      const max = Math.max(...c.values());
      return [...c.entries()].find(([, n]) => n === max)?.[0] ?? null;
    }
    case 'sum':
      return xs.reduce((a, b) => a + b, 0);
    case 'variance':
      return variance;
    case 'std dev':
    case 'standard deviation':
      return Math.sqrt(variance);
    default:
      return null;
  }
}

function trySolve(equation: string): AssistantReply {
  const parts = equation.split('=');
  if (parts.length !== 2) {
    return { kind: 'error', text: 'Equations must contain exactly one "=" sign.' };
  }
  const lhs = cleanExpr(parts[0]);
  const rhs = cleanExpr(parts[1]);
  const f = makeFunction1D(`(${lhs}) - (${rhs})`);

  const f0 = f(0);
  const f1 = f(1);
  const fm1 = f(-1);
  const f2 = f(2);

  if (![f0, f1, fm1, f2].every(Number.isFinite)) {
    return {
      kind: 'error',
      text: 'Could not evaluate — check the syntax of your equation.',
    };
  }

  const aL = f1 - f0;
  const bL = f0;
  if (Math.abs(-aL + bL - fm1) < 1e-7 * (1 + Math.abs(fm1))) {
    const r = solveLinear(aL, bL);
    if (!r.ok) return { kind: 'error', text: r.error ?? 'No solution.' };
    const x = r.roots?.[0]?.value;
    if (x === undefined) return { kind: 'error', text: 'No unique solution.' };
    return {
      kind: 'answer',
      text: `x = ${formatNumber(x, { precision: 10 })}`,
      details: r.steps,
      tool: 'equations',
    };
  }

  const aQ = (f1 + fm1 - 2 * f0) / 2;
  const bQ = (f1 - fm1) / 2;
  const cQ = f0;
  if (Math.abs(aQ * 4 + bQ * 2 + cQ - f2) < 1e-7 * (1 + Math.abs(f2))) {
    const r = solveQuadratic(aQ, bQ, cQ);
    if (!r.ok) return { kind: 'error', text: r.error ?? 'No solution.' };
    const roots = r.roots ?? [];
    const txt =
      roots.length === 0
        ? 'No solution.'
        : roots
            .map(
              (rt, i) =>
                `x${i + 1} = ${rt.exact ?? formatNumber(rt.value, { precision: 10 })}`,
            )
            .join(', ');
    return { kind: 'answer', text: txt, details: r.steps, tool: 'equations' };
  }

  return {
    kind: 'unsupported',
    text: 'Only linear and quadratic equations are supported by the offline assistant.',
  };
}

export function answerOffline(question: string): AssistantReply {
  const q = question.trim();
  if (!q) return { kind: 'error', text: 'Ask me a maths question.' };

  const solveMatch = q.match(/^\s*(?:solve|find\s+x|roots?\s+of)\s+(.+)$/i);
  if (solveMatch) return trySolve(solveMatch[1]);

  const derivMatch = q.match(
    /^\s*(?:derivative\s+of|differentiate|d\/dx)\s+(.+?)(?:\s+with\s+respect\s+to\s+x)?\s*$/i,
  );
  if (derivMatch) {
    const expr = cleanExpr(derivMatch[1]);
    const r = symbolicDerivative(expr, 'x');
    if (r.ok) {
      return {
        kind: 'answer',
        text: `d/dx (${expr}) = ${r.value}`,
        details: ['Computed symbolically in radian convention.'],
        tool: 'calculus',
      };
    }
    return { kind: 'error', text: r.error ?? 'Could not differentiate that.' };
  }

  const intMatch = q.match(
    /^\s*(?:integrate|integral\s+of|∫)\s+(.+?)\s+(?:from|between)\s+(.+?)\s+(?:to|and)\s+(.+)$/i,
  );
  if (intMatch) {
    const expr = cleanExpr(intMatch[1]);
    const a = Number(cleanExpr(intMatch[2]));
    const b = Number(cleanExpr(intMatch[3]));
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return { kind: 'error', text: 'Could not read the integration bounds.' };
    }
    const f = makeFunction1D(expr);
    const out = integrateAdaptive(f, a, b);
    if (!Number.isFinite(out.value)) {
      return {
        kind: 'error',
        text: 'The integrand is not finite over that interval — the integral diverges.',
      };
    }
    return {
      kind: 'answer',
      text: `∫ from ${a} to ${b} of ${expr} ≈ ${formatNumber(out.value, { precision: 10 })}`,
      details: [
        'Numeric result (adaptive Simpson). Not a symbolic antiderivative.',
        out.converged
          ? 'Estimate converged to the requested tolerance.'
          : 'Tolerance not reached — treat this value as approximate.',
      ],
      tool: 'calculus',
    };
  }

  const convMatch = q.match(
    /^\s*(?:convert\s+)?(-?[\d.]+)\s*([a-zA-Z°²³/]+)\s+(?:to|in)\s+([a-zA-Z°²³/]+)\s*$/i,
  );
  if (convMatch) {
    const value = Number(convMatch[1]);
    const from = convMatch[2].toLowerCase();
    const to = convMatch[3].toLowerCase();
    for (const cat of CATEGORIES) {
      const fromUnit = cat.units.find(
        (u) => u.id.toLowerCase() === from || u.symbol.toLowerCase() === from,
      );
      const toUnit = cat.units.find(
        (u) => u.id.toLowerCase() === to || u.symbol.toLowerCase() === to,
      );
      if (fromUnit && toUnit) {
        const v = convert(value, fromUnit.id, toUnit.id, cat);
        return {
          kind: 'answer',
          text: `${value} ${fromUnit.symbol} = ${formatNumber(v, {
            precision: 10,
          })} ${toUnit.symbol}`,
          tool: 'converter',
        };
      }
    }
    return {
      kind: 'error',
      text: 'I could not match those units. Try "5 km to miles" or "100 c to f".',
    };
  }

  const pctMatch = q.match(/([\d.]+)\s*%\s*of\s*([\d.]+)/i);
  if (pctMatch) {
    const pct = Number(pctMatch[1]);
    const of = Number(pctMatch[2]);
    return {
      kind: 'answer',
      text: `${pct}% of ${of} = ${formatNumber((pct / 100) * of, { precision: 10 })}`,
    };
  }

  const statMatch = q.match(
    /^\s*(mean|median|mode|average|sum|std\s*dev|standard\s*deviation|variance)\s+of\s+(.+)$/i,
  );
  if (statMatch) {
    const op = statMatch[1].toLowerCase();
    const nums = statMatch[2]
      .split(/[\s,;]+/)
      .map(Number)
      .filter(Number.isFinite);
    if (nums.length === 0) return { kind: 'error', text: 'No numbers found after "of".' };
    const result = computeStat(op, nums);
    if (result === null) return { kind: 'error', text: `I do not support "${op}" yet.` };
    return {
      kind: 'answer',
      text: `${op} of [${nums.join(', ')}] = ${formatNumber(result, { precision: 10 })}`,
    };
  }

  const evaluated = evaluateExpression(q, { angleMode: 'deg' });
  if (evaluated.ok) {
    return { kind: 'answer', text: `= ${evaluated.value}`, tool: 'evaluate' };
  }

  return {
    kind: 'unsupported',
    text: 'I could not interpret that with the local engine. I can help with:',
    details: [
      'Arithmetic: "2 + 3 * 4", "sqrt(81)", "sin(30) + cos(60)"',
      'Equations: "solve 2x + 5 = 17", "solve x^2 - 5x + 6 = 0"',
      'Calculus: "derivative of x^2 * sin(x)", "integrate sin(x) from 0 to pi"',
      'Units: "convert 5 km to miles", "100 c to f"',
      'Percentages: "15% of 2400"',
      'Statistics: "mean of 2, 4, 4, 4, 5, 5, 7, 9"',
    ],
  };
}