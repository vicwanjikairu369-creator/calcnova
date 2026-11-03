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
  lastValue?: number; // Enables conversational follow-ups ("divide by 2")
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

// --- Statistics Helper ---
function computeStat(op: string, xs: number[]): number | null {
  if (xs.length === 0) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length > 1 ? xs.length - 1 : 1);
  
  switch (op) {
    case 'mean':
    case 'average': 
      return mean;
    case 'median': {
      const s = [...xs].sort((a, b) => a - b);
      return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
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

export function answerOffline(question: string, previousValue?: number): AssistantReply {
  const q = question.trim();
  const lq = q.toLowerCase();
  if (!lq) return { kind: 'error', text: 'Ask me a maths question.' };

  // --- 1. Conversational Follow-ups ("divided by 3", "times 5") ---
  if (previousValue !== undefined && /^(plus|minus|times|divided by)\s+[\d.]+/.test(lq)) {
    const mathExpr = `${previousValue} ${lq.replace('plus', '+').replace('minus', '-').replace('times', '*').replace('divided by', '/')}`;
    const res = evaluateExpression(mathExpr, { angleMode: 'deg' });
    if (res.ok && typeof res.value === 'number') {
      return { 
        kind: 'answer', 
        text: `${previousValue} ${lq} = ${formatNumber(res.value, { precision: 10 })}`, 
        lastValue: res.value 
      };
    }
  }

  // --- 2. Finance ---
  if (/compound interest/.test(lq)) {
    const nums = lq.match(/[\d.]+/g)?.map(Number) || [];
    if (nums.length >= 3) {
      const [p, r, t] = nums;
      const amount = p * Math.pow(1 + r / 100, t);
      return { 
        kind: 'answer', 
        text: `Compound interest on ${p} at ${r}% for ${t} years is roughly ${formatNumber(amount, { precision: 8 })} (assuming annual compounding).`,
        lastValue: amount
      };
    }
    return { kind: 'unsupported', text: 'Try something like: "compound interest on 1000 at 5% for 10 years"' };
  }
  
  if (/loan|mortgage/.test(lq)) {
    const nums = lq.match(/[\d.]+/g)?.map(Number) || [];
    if (nums.length >= 3) {
      const [p, r, years] = nums;
      const monthly = (r / 100) / 12;
      const n = years * 12;
      const payment = monthly === 0 ? p / n : (p * monthly) / (1 - Math.pow(1 + monthly, -n));
      return { 
        kind: 'answer', 
        text: `Monthly payment for ${p} at ${r}% over ${years} years is ${formatNumber(payment, { precision: 8 })}`,
        lastValue: payment
      };
    }
  }

  // --- 3. Calculus ---
  const derivMatch = lq.match(/^(?:derivative\s+of|differentiate|d\/dx)\s+(.+?)(?:\s+with\s+respect\s+to\s+x)?$/);
  if (derivMatch) {
    const expr = cleanExpr(derivMatch[1]);
    const r = symbolicDerivative(expr, 'x');
    if (r.ok) return { kind: 'answer', text: `d/dx (${expr}) = ${r.value}` };
    return { kind: 'error', text: r.error ?? 'Could not differentiate.' };
  }

  const intMatch = lq.match(/^(?:integrate|integral\s+of|∫)\s+(.+?)\s+(?:from|between)\s+(.+?)\s+(?:to|and)\s+(.+)$/);
  if (intMatch) {
    const expr = cleanExpr(intMatch[1]);
    const a = Number(cleanExpr(intMatch[2]));
    const b = Number(cleanExpr(intMatch[3]));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const f = makeFunction1D(expr);
      const out = integrateAdaptive(f, a, b);
      if (Number.isFinite(out.value)) {
        return { 
          kind: 'answer', 
          text: `∫ from ${a} to ${b} of ${expr} ≈ ${formatNumber(out.value, { precision: 10 })}`,
          lastValue: out.value,
          details: ['Numeric result (adaptive Simpson).']
        };
      }
      return { kind: 'error', text: 'The integral diverges or is undefined in that interval.' };
    }
  }

  // --- 4. Equations ---
  const solveMatch = lq.match(/^(?:solve|find\s+x|roots?\s+of)\s+(.+)$/);
  if (solveMatch) {
    const eq = cleanExpr(solveMatch[1]);
    const parts = eq.split('=');
    if (parts.length === 2) {
      const f = makeFunction1D(`(${parts[0]}) - (${parts[1]})`);
      const f0 = f(0), f1 = f(1), fm1 = f(-1);
      
      if ([f0, f1, fm1].every(Number.isFinite)) {
        const aL = f1 - f0;
        const bL = f0;
        
        // Linear check
        if (Math.abs(-aL + bL - fm1) < 1e-7) {
          const r = solveLinear(aL, bL);
          if (r.ok && r.roots?.[0]) {
            return { kind: 'answer', text: `x = ${formatNumber(r.roots[0].value, { precision: 10 })}`, lastValue: r.roots[0].value, details: r.steps };
          }
        }
        
        // Quadratic check
        const f2 = f(2);
        const aQ = (f1 + fm1 - 2 * f0) / 2;
        const bQ = (f1 - fm1) / 2;
        if (Math.abs(aQ * 4 + bQ * 2 + f0 - f2) < 1e-7) {
          const r = solveQuadratic(aQ, bQ, f0);
          if (r.ok && r.roots) {
            const txt = r.roots.map((x, i) => `x${i+1} = ${x.exact ?? formatNumber(x.value, { precision: 10 })}`).join(', ');
            return { kind: 'answer', text: txt, lastValue: r.roots[0].value, details: r.steps };
          }
        }
      }
    }
    return { kind: 'unsupported', text: 'I can only solve linear or quadratic equations offline. Try "solve 2x+5=17".' };
  }

  // --- 5. Conversions ---
  const convMatch = lq.match(/^(?:convert\s+)?(-?[\d.]+)\s*([a-zA-Z°²³/]+)\s+(?:to|in)\s+([a-zA-Z°²³/]+)$/);
  if (convMatch) {
    const value = Number(convMatch[1]);
    const from = convMatch[2].toLowerCase();
    const to = convMatch[3].toLowerCase();
    for (const cat of CATEGORIES) {
      const fromUnit = cat.units.find((u) => u.id.toLowerCase() === from || u.symbol.toLowerCase() === from);
      const toUnit = cat.units.find((u) => u.id.toLowerCase() === to || u.symbol.toLowerCase() === to);
      if (fromUnit && toUnit) {
        const v = convert(value, fromUnit.id, toUnit.id, cat);
        return { kind: 'answer', text: `${value} ${fromUnit.symbol} = ${formatNumber(v, { precision: 10 })} ${toUnit.symbol}`, lastValue: v };
      }
    }
    return { kind: 'error', text: 'Could not match those units. Try "5 km to miles".' };
  }

  // --- 6. Statistics ---
  const statMatch = lq.match(/^(mean|median|mode|average|sum|std\s*dev|standard\s*deviation|variance)\s+of\s+(.+)$/);
  if (statMatch) {
    const op = statMatch[1];
    const nums = statMatch[2].split(/[\s,;]+/).map(Number).filter(Number.isFinite);
    if (nums.length > 0) {
      const result = computeStat(op, nums);
      if (result !== null) return { kind: 'answer', text: `${op} = ${formatNumber(result, { precision: 10 })}`, lastValue: result };
    }
  }

  // --- 7. Percentages ---
  const pctMatch = q.match(/([\d.]+)\s*%\s*of\s*([\d.]+)/i);
  if (pctMatch) {
    const pct = Number(pctMatch[1]);
    const of = Number(pctMatch[2]);
    const res = (pct / 100) * of;
    return { kind: 'answer', text: `${pct}% of ${of} = ${formatNumber(res, { precision: 10 })}`, lastValue: res };
  }

  // --- 8. Raw Math Expression ---
  const evaluated = evaluateExpression(question, { angleMode: 'deg' });
  if (evaluated.ok && typeof evaluated.value === 'number') {
    return { kind: 'answer', text: `= ${formatNumber(evaluated.value, { precision: 10 })}`, lastValue: evaluated.value };
  }

  // --- Fallback ---
  return {
    kind: 'unsupported',
    text: 'I am not sure how to answer that offline. I can help with:',
    details: [
      'Arithmetic: "2 + 3 * 4"',
      'Equations: "solve 2x + 5 = 17"',
      'Calculus: "derivative of x^2", "integrate sin(x) from 0 to pi"',
      'Finance: "loan 200000 at 5% for 30 years"',
      'Units: "5 km to miles"',
      'Stats: "mean of 2, 4, 4, 5"',
      'Follow-ups: "divided by 3" (after a previous answer)',
    ],
  };
}