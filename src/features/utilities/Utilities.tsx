import { useState } from 'react';

type Mode = 'dateDiff' | 'bmi' | 'percentage' | 'gcdlcm' | 'matrix' | 'sciNotation';

export function Utilities() {
  const [mode, setMode] = useState<Mode>('dateDiff');
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Utilities</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">Everyday helpers — dates, percentages, matrices and more.</p>
      </header>
      <div className="flex flex-wrap gap-1 rounded-lg border border-navy-200 p-1 dark:border-navy-700 w-fit">
        {([
          ['dateDiff', 'Date difference'],
          ['bmi', 'BMI'],
          ['percentage', 'Percentage'],
          ['gcdlcm', 'GCD / LCM'],
          ['matrix', 'Matrix'],
          ['sciNotation', 'Sci notation'],
        ] as const).map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${mode === m ? 'bg-violet-600 text-white' : 'text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800'}`}>
            {label}
          </button>
        ))}
      </div>
      {mode === 'dateDiff' && <DateDiff />}
      {mode === 'bmi' && <BMI />}
      {mode === 'percentage' && <Percentage />}
      {mode === 'gcdlcm' && <GcdLcm />}
      {mode === 'matrix' && <Matrix />}
      {mode === 'sciNotation' && <SciNotation />}
    </div>
  );
}

function DateDiff() {
  const [a, setA] = useState(new Date().toISOString().slice(0, 10));
  const [b, setB] = useState(new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10));
  const da = new Date(a); const db = new Date(b);
  const valid = !isNaN(da.getTime()) && !isNaN(db.getTime());
  const days = valid ? Math.round((db.getTime() - da.getTime()) / 86400000) : NaN;
  const weeks = valid ? days / 7 : NaN;
  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1"><span className="label">Start</span><input type="date" className="input" value={a} onChange={(e) => setA(e.target.value)} /></label>
        <label className="space-y-1"><span className="label">End</span><input type="date" className="input" value={b} onChange={(e) => setB(e.target.value)} /></label>
      </div>
      {valid && (
        <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60 space-y-1">
          <div>Days: <strong>{days}</strong></div>
          <div>Weeks: <strong>{weeks.toFixed(2)}</strong></div>
          <div>Working days (approx): <strong>{Math.round((days / 7) * 5)}</strong></div>
        </div>
      )}
    </div>
  );
}

function BMI() {
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(175);
  const bmi = cm > 0 ? kg / ((cm / 100) ** 2) : NaN;
  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1"><span className="label">Weight (kg)</span><input type="number" className="input" value={kg} onChange={(e) => setKg(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Height (cm)</span><input type="number" className="input" value={cm} onChange={(e) => setCm(Number(e.target.value))} /></label>
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60">
        BMI = {Number.isFinite(bmi) ? bmi.toFixed(2) : '—'}
        <p className="mt-2 text-xs text-navy-400">
          BMI is a crude population-level screening index and does not directly measure health, body
          composition or individual fitness. Interpret with care and, where relevant, with a clinician.
        </p>
      </div>
    </div>
  );
}

function Percentage() {
  const [a, setA] = useState(15);
  const [b, setB] = useState(2400);
  const pct = (a / 100) * b;
  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1"><span className="label">Percent (%)</span><input type="number" className="input" value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Of value</span><input type="number" className="input" value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60">
        {a}% of {b} = <strong>{pct}</strong>
      </div>
    </div>
  );
}

function GcdLcm() {
  const [a, setA] = useState(48);
  const [b, setB] = useState(180);
  const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
  const g = (Number.isInteger(a) && Number.isInteger(b)) ? gcd(a, b) : NaN;
  const l = Number.isFinite(g) && g !== 0 ? Math.abs(a * b) / g : NaN;
  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1"><span className="label">a</span><input type="number" className="input" value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">b</span><input type="number" className="input" value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60 space-y-1">
        <div>GCD: <strong>{Number.isFinite(g) ? g : '—'}</strong></div>
        <div>LCM: <strong>{Number.isFinite(l) ? l : '—'}</strong></div>
      </div>
    </div>
  );
}

function Matrix() {
  const [a, setA] = useState('1 2\n3 4');
  const [b, setB] = useState('5 6\n7 8');
  const [op, setOp] = useState<'add' | 'mul' | 'det'>('mul');

  const parse = (s: string): number[][] | null => {
    const rows = s.trim().split('\n').map((r) => r.trim().split(/[\s,]+/).map(Number));
    if (rows.some((r) => r.some((v) => !Number.isFinite(v)))) return null;
    return rows;
  };

  const A = parse(a); const B = parse(b);
  let result: number[][] | string | null = null;

  if (A && B) {
    if (op === 'add') {
      if (A.length !== B.length || A[0].length !== B[0].length) result = 'Shape mismatch';
      else result = A.map((row, i) => row.map((v, j) => v + B[i][j]));
    } else if (op === 'mul') {
      if (A[0].length !== B.length) result = 'Inner dimensions mismatch';
      else result = A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
    } else {
      if (A.length !== 2 || A[0].length !== 2) result = 'Only 2×2 determinant supported';
      else result = String(A[0][0] * A[1][1] - A[0][1] * A[1][0]);
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex gap-2">
        {(['add', 'mul', 'det'] as const).map((o) => (
          <button key={o} onClick={() => setOp(o)} aria-pressed={op === o}
            className={`px-3 py-1 rounded-full text-xs ${op === o ? 'bg-violet-600 text-white' : 'bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200'}`}>
            {o === 'add' ? 'A + B' : o === 'mul' ? 'A × B' : 'det(A)'}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1"><span className="label">Matrix A</span><textarea className="input font-mono min-h-20" value={a} onChange={(e) => setA(e.target.value)} /></label>
        {op !== 'det' && <label className="space-y-1"><span className="label">Matrix B</span><textarea className="input font-mono min-h-20" value={b} onChange={(e) => setB(e.target.value)} /></label>}
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60">
        <div className="label">Result</div>
        <pre className="mt-1 font-mono text-sm">{Array.isArray(result) ? result.map((r) => r.join('  ')).join('\n') : result ?? '—'}</pre>
      </div>
    </div>
  );
}

function SciNotation() {
  const [v, setV] = useState('12345.678');
  const n = Number(v);
  const valid = Number.isFinite(n);
  return (
    <div className="card p-4 space-y-3">
      <label className="space-y-1 block">
        <span className="label">Number</span>
        <input className="input font-mono" value={v} onChange={(e) => setV(e.target.value)} />
      </label>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60 space-y-1">
        <div>Scientific: <strong>{valid ? n.toExponential(6) : '—'}</strong></div>
        <div>Engineering: <strong>{valid ? n.toExponential(3).replace(/e([+-])(\d+)/, (_m, s, d) => `×10^${s === '+' ? '' : '-'}${d}`) : '—'}</strong></div>
      </div>
    </div>
  );
}