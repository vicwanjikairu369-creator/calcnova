// Expression sanitisation helpers shared by calculators.

export function sanitizeInput(input: string): string {
  return input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .trim();
}

export function isBalanced(expr: string): boolean {
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

export function endsWithOperator(expr: string): boolean {
  return /[+\-*/^%]$/.test(expr.trim());
}

export function hasTrailingDecimal(expr: string): boolean {
  return /\d*\.$/.test(expr.trim());
}