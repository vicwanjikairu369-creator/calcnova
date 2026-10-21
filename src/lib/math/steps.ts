import { math } from './evaluate';
import type { MathNode } from 'mathjs';

export interface CalcStep {
  before: string;
  after: string;
  note: string;
}

export interface StepsResult {
  ok: boolean;
  steps: CalcStep[];
  final?: string;
  error?: string;
}

const CONSTANT_SYMBOLS = new Set(['pi', 'e', 'tau', 'phi', 'Infinity', 'NaN']);

function isLeafConstant(node: MathNode): boolean {
  if (node.type === 'ConstantNode') return true;
  if (node.type === 'SymbolNode') {
    const name = (node as unknown as { name?: string }).name ?? '';
    return CONSTANT_SYMBOLS.has(name);
  }
  return false;
}

function isReducible(node: MathNode): boolean {
  const t = node.type;
  if (t !== 'OperatorNode' && t !== 'FunctionNode') return false;
  let allConstant = true;
  node.forEach((child) => {
    if (!isLeafConstant(child)) allConstant = false;
  });
  return allConstant;
}

interface Candidate {
  node: MathNode;
  depth: number;
  index: number;
}

function collect(
  node: MathNode,
  depth: number,
  counter: { n: number },
  out: Candidate[],
): void {
  if (isReducible(node)) out.push({ node, depth, index: counter.n++ });
  node.forEach((child) => collect(child, depth + 1, counter, out));
}

export function traceExpression(
  expression: string,
  _opts: { angleMode?: 'deg' | 'rad' } = {},
): StepsResult {
  const expr = expression.trim();
  if (!expr) return { ok: false, steps: [], error: 'Empty expression' };
  if (expr.length > 500) return { ok: false, steps: [], error: 'Expression too long' };

  let node: MathNode;
  try {
    node = math.parse(expr);
  } catch (e) {
    return { ok: false, steps: [], error: (e as Error).message };
  }

  const steps: CalcStep[] = [];
  const MAX = 40;

  for (let i = 0; i < MAX; i++) {
    const candidates: Candidate[] = [];
    collect(node, 0, { n: 0 }, candidates);
    if (candidates.length === 0) break;

    candidates.sort((a, b) => b.depth - a.depth || a.index - b.index);
    const target = candidates[0].node;
    const before = node.toString();

    let value: string | number | boolean | null | undefined;
    try {
      value = target.evaluate() as string | number | boolean | null | undefined;
    } catch (e) {
      return { ok: false, steps: [], error: (e as Error).message };
    }

    const constant = new math.ConstantNode(value);
    node = node.transform((n) => (n === target ? constant : n));
    const after = node.toString();

    if (before === after) break;

    steps.push({
      before,
      after,
      note: `${target.toString()} = ${math.format(value)}`,
    });
  }

  let final: string;
  try {
    final = math.format(node.evaluate());
  } catch (e) {
    return { ok: false, steps: [], error: (e as Error).message };
  }

  return { ok: true, steps, final };
}