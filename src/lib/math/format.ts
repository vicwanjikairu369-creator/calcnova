import { math } from './evaluate';

export interface FormatOptions {
  precision?: number;
  thousands?: boolean;
}

export function formatNumber(value: number | string, opts: FormatOptions = {}): string {
  const precision = opts.precision ?? 12;
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) {
    if (Number.isNaN(value)) return 'NaN';
    return value > 0 ? '∞' : '-∞';
  }
  if (value === 0) return '0';

  const abs = Math.abs(value);
  // Use scientific notation for very large/small numbers
  if (abs >= 1e15 || abs < 1e-9) {
    return value.toExponential(Math.min(precision, 10));
  }
  const str = math.format(value, { precision, notation: 'auto' }) as string;
  if (opts.thousands) return addThousands(str);
  return str;
}

function addThousands(s: string): string {
  // Only separate the integer part; ignore exponent.
  const [mantissa, exp] = s.split('e');
  const [intPart, decPart] = mantissa.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const digits = sign ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let out = sign + grouped + (decPart ? '.' + decPart : '');
  if (exp) out += 'e' + exp;
  return out;
}