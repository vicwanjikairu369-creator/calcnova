import { create, all, type MathJsInstance } from 'mathjs';

// Create a mathjs instance with the functions we actually need.
export const math: MathJsInstance = create(all, {});

// Harden: remove unsafe access surfaces if any are exposed.
// mathjs does not use eval/new Function on user input; its parser is safe.
// We still guard by rejecting dangerous identifiers.

const BLOCKED = /\b(import|require|eval|Function|constructor|__proto__|prototype)\b/i;

export interface EvalOk {
  ok: true;
  value: number | string;
  raw: unknown;
}
export interface EvalErr {
  ok: false;
  error: string;
}
export type EvalResult = EvalOk | EvalErr;

export interface EvalOptions {
  angleMode?: 'deg' | 'rad';
  scope?: Record<string, unknown>;
  precision?: number;
}

export function evaluateExpression(expression: string, opts: EvalOptions = {}): EvalResult {
  const expr = expression.trim();
  if (!expr) return { ok: false, error: 'Empty expression' };
  if (expr.length > 2000) return { ok: false, error: 'Expression too long' };
  if (BLOCKED.test(expr)) return { ok: false, error: 'Disallowed identifier in expression' };

  const scope: Record<string, unknown> = { ...(opts.scope ?? {}) };
  const mathInstance = opts.angleMode === 'deg' ? withDegrees() : math;

  try {
    const raw = mathInstance.evaluate(expr, scope);
    if (typeof raw === 'number') {
      if (Number.isNaN(raw)) return { ok: false, error: 'Result is not a number (NaN)' };
      if (!Number.isFinite(raw)) {
        if (raw === Infinity) return { ok: false, error: 'Result is infinite' };
        return { ok: false, error: 'Result is undefined' };
      }
    }
    const value =
      typeof raw === 'number' || typeof raw === 'string'
        ? raw
        : (math.format(raw) as string);
    return { ok: true, value, raw };
  } catch (e) {
    return { ok: false, error: humanizeError((e as Error).message) };
  }
}

function humanizeError(msg: string): string {
  if (/division by zero/i.test(msg)) return 'Division by zero';
  if (/undefined/i.test(msg)) return 'Undefined result';
  if (/Unexpected end of expression/i.test(msg)) return 'Incomplete expression';
  if (/Unexpected (operator|part)/i.test(msg)) return 'Invalid operator sequence';
  if (/Parenthesis \) expected/i.test(msg)) return 'Missing closing parenthesis';
  if (/Value expected/i.test(msg)) return 'Missing value';
  return msg.replace(/^Error:\s*/i, '');
}

// Degrees-aware instance: wrap trig functions so users get degree-based sin/cos/tan.
let degInstance: MathJsInstance | null = null;
function withDegrees(): MathJsInstance {
  if (degInstance) return degInstance;
  const m = create(all, {}) as MathJsInstance;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const toDeg = (x: number) => (x * 180) / Math.PI;
  m.import(
    {
      sin: (x: number) => Math.sin(toRad(x)),
      cos: (x: number) => Math.cos(toRad(x)),
      tan: (x: number) => Math.tan(toRad(x)),
      asin: (x: number) => toDeg(Math.asin(x)),
      acos: (x: number) => toDeg(Math.acos(x)),
      atan: (x: number) => toDeg(Math.atan(x)),
    },
    { override: true },
  );
  degInstance = m;
  return m;
}