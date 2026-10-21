import { useState } from 'react';
import { solveLinear, solveQuadratic, solveLinearSystem, type SolveResult } from '@/lib/math/solvers';

type Mode = 'linear' | 'quadratic' | 'system';

export function EquationSolver() {
  const [mode, setMode] = useState<Mode>('quadratic');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Equation solver</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Linear, quadratic and linear systems, with steps where they can be shown reliably.
        </p>
      </header>

      <div className="flex gap-1 rounded-lg border border-navy-200 p-1 dark:border-navy-700 w-fit">
        {(['linear', 'quadratic', 'system'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${
              mode === m ? 'bg-violet-600 text-white' : 'text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800'
            }`}
          >
            {m === 'linear' ? 'ax + b = 0' : m === 'quadratic' ? 'ax² + bx + c = 0' : '2×2 system'}
          </button>
        ))}
      </div>

      {mode === 'linear' && <LinearForm />}
      {mode === 'quadratic' && <QuadraticForm />}
      {mode === 'system' && <SystemForm />}
    </div>
  );
}

function ResultView({ result }: { result: SolveResult }) {
  if (!result.ok) {
    return <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{result.error}</div>;
  }
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-violet-950/40">
        <div className="label text-violet-700 dark:text-violet-300">Solution</div>
        <div className="mt-1 font-mono text-lg text-violet-900 dark:text-violet-100">
          {result.roots && result.roots.length > 0
            ? result.roots.map((r, i) => (
                <div key={i}>{r.exact ?? `x${result.roots!.length > 1 ? `₍${i + 1}₎` : ''} = ${r.value}`}</div>
              ))
            : 'No finite solution'}
        </div>
        {result.approximate && <p className="mt-1 text-xs text-violet-700/80 dark:text-violet-300/80">Values shown include numerical approximations.</p>}
      </div>
      {result.steps && (
        <div className="card p-3">
          <div className="label">Steps</div>
          <ol className="mt-2 space-y-1 text-sm">
            {result.steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-navy-400">{i + 1}.</span>
                <span className="font-mono text-navy-700 dark:text-navy-200">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function LinearForm() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(5);
  const [r, setR] = useState<SolveResult | null>(null);
  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1"><span className="label">a</span><input type="number" className="input" value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">b</span><input type="number" className="input" value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
      </div>
      <button className="btn-primary" onClick={() => setR(solveLinear(a, b))}>Solve a·x + b = 0</button>
      {r && <ResultView result={r} />}
    </div>
  );
}

function QuadraticForm() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-5);
  const [c, setC] = useState(6);
  const [r, setR] = useState<SolveResult | null>(null);
  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1"><span className="label">a</span><input type="number" className="input" value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">b</span><input type="number" className="input" value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">c</span><input type="number" className="input" value={c} onChange={(e) => setC(Number(e.target.value))} /></label>
      </div>
      <button className="btn-primary" onClick={() => setR(solveQuadratic(a, b, c))}>Solve</button>
      {r && <ResultView result={r} />}
    </div>
  );
}

function SystemForm() {
  const [m, setM] = useState<string[][]>([
    ['2', '1', '5'],
    ['1', '-1', '1'],
  ]);
  const [r, setR] = useState<SolveResult | null>(null);

  const solve = () => {
    const nums = m.map((row) => row.map(Number));
    if (nums.some((row) => row.some((v) => !Number.isFinite(v)))) {
      setR({ ok: false, error: 'All entries must be numbers.' });
      return;
    }
    const A = nums.map((row) => row.slice(0, 2));
    const b = nums.map((row) => row[2]);
    setR(solveLinearSystem(A, b));
  };

  return (
    <div className="card p-4 space-y-3">
      <p className="text-sm text-navy-500 dark:text-navy-400">Enter coefficients. Row format: a₁ x + b₁ y = c₁</p>
      <div className="space-y-2">
        {m.map((row, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-center">
            {row.map((cell, j) => (
              <input
                key={j}
                className="input text-center"
                value={cell}
                onChange={(e) => {
                  const next = m.map((r) => [...r]);
                  next[i][j] = e.target.value;
                  setM(next);
                }}
                aria-label={`Row ${i + 1} coefficient ${j + 1}`}
              />
            ))}
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={solve}>Solve</button>
      {r && <ResultView result={r} />}
    </div>
  );
}