import { create, all } from 'mathjs';
const math = create(all, {});
export function evaluateExpression(expr: string, scope?: Record<string, any>) {
  try {
    const result = math.evaluate(expr, scope);
    return { ok: true, value: result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}