import { useMemo, useState } from 'react';

type Width = 8 | 16 | 32 | 64;

export function Programmer() {
  const [value, setValue] = useState('0');
  const [width, setWidth] = useState<Width>(32);
  const [signed, setSigned] = useState(true);
  const [b, setB] = useState('0');
  const [op, setOp] = useState<'AND' | 'OR' | 'XOR' | 'LSH' | 'RSH'>('AND');

  const parsed = useMemo(() => {
    const v = parseInput(value);
    if (v === null) return null;
    return toWidth(v, width, signed);
  }, [value, width, signed]);

  const result = useMemo(() => {
    const bv = parseInput(b);
    if (parsed === null || bv === null) return null;
    const bw = toWidth(bv, width, signed);
    switch (op) {
      case 'AND': return toWidth(parsed & bw, width, signed);
      case 'OR': return toWidth(parsed | bw, width, signed);
      case 'XOR': return toWidth(parsed ^ bw, width, signed);
      case 'LSH': return toWidth(parsed << bw, width, signed);
      case 'RSH': return toWidth(parsed >> bw, width, signed);
    }
  }, [parsed, b, op, width, signed]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Programmer calculator</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Base conversion and bitwise operations with configurable integer width.
        </p>
      </header>

      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="space-y-1">
            <span className="label">Bit width</span>
            <select className="input" value={width} onChange={(e) => setWidth(Number(e.target.value) as Width)}>
              <option value={8}>8-bit</option>
              <option value={16}>16-bit</option>
              <option value={32}>32-bit</option>
              <option value={64}>64-bit</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="label">Interpretation</span>
            <select className="input" value={signed ? 'signed' : 'unsigned'} onChange={(e) => setSigned(e.target.value === 'signed')}>
              <option value="signed">Signed</option>
              <option value="unsigned">Unsigned</option>
            </select>
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="label">Value (accepts 0x, 0b, 0o, decimal)</span>
          <input className="input font-mono text-lg" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>

        {parsed === null ? (
          <p className="text-sm text-red-500">Invalid value for the selected base or width.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Row label="Decimal" value={String(parsed)} />
            <Row label="Hex" value={`0x${(parsed >>> 0).toString(16).toUpperCase()}`} />
            <Row label="Octal" value={`0o${(parsed >>> 0).toString(8)}`} />
            <Row label="Binary" value={formatBinary(parsed, width)} />
          </div>
        )}

        <div className="border-t border-navy-200 pt-4 dark:border-navy-800 space-y-3">
          <div className="label">Bitwise operation</div>
          <div className="flex flex-wrap gap-2">
            {(['AND', 'OR', 'XOR', 'LSH', 'RSH'] as const).map((o) => (
              <button key={o} onClick={() => setOp(o)} aria-pressed={op === o}
                className={`px-3 py-1 rounded-full text-xs font-medium ${op === o ? 'bg-violet-600 text-white' : 'bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200'}`}>
                {o}
              </button>
            ))}
          </div>
          <label className="space-y-1 block">
            <span className="label">Operand B</span>
            <input className="input font-mono" value={b} onChange={(e) => setB(e.target.value)} />
          </label>
          {result !== null && (
            <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-950/60 font-mono text-sm">
              <div>Result (decimal): <strong>{result}</strong></div>
              <div>Result (hex): 0x{(result >>> 0).toString(16).toUpperCase()}</div>
              <div>Result (binary): {formatBinary(result, width)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-navy-200 p-3 dark:border-navy-800">
      <div className="label">{label}</div>
      <div className="mt-1 font-mono text-sm break-all">{value}</div>
    </div>
  );
}

function parseInput(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  let n: number;
  try {
    if (/^-?0x[0-9a-f]+$/i.test(t)) n = parseInt(t, 16);
    else if (/^-?0b[01]+$/i.test(t)) n = parseInt(t, 2);
    else if (/^-?0o[0-7]+$/i.test(t)) n = parseInt(t, 8);
    else n = Number(t);
  } catch { return null; }
  if (!Number.isFinite(n)) return null;
  return n;
}

function toWidth(n: number, width: number, signed: boolean): number {
  const mask = width === 64 ? 0xffffffffffffffffn : BigInt((1 << width) - 1);
  const bn = BigInt(Math.trunc(n)) & mask;
  if (!signed) return Number(bn);
  const signBit = 1n << BigInt(width - 1);
  if (bn & signBit) return Number(bn - (1n << BigInt(width)));
  return Number(bn);
}

function formatBinary(n: number, width: number): string {
  const mask = width === 64 ? 0xffffffffffffffffn : BigInt((1 << width) - 1);
  const bn = BigInt(Math.trunc(n)) & mask;
  const bin = bn.toString(2).padStart(width, '0');
  return bin.match(/.{1,4}/g)?.join(' ') ?? bin;
}