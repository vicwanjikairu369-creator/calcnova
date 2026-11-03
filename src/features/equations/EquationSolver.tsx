import { useRef, useState } from 'react';
import { Database, Delete } from 'lucide-react';
import { solveLinear, solveQuadratic, solveLinearSystem, type SolveResult } from '@/lib/math/solvers';
import { useWorkspace } from '@/hooks/useWorkspace';
import { math } from '@/lib/math/evaluate';

type Mode = 'linear' | 'quadratic' | 'cubic' | 'system';

export function EquationSolver() {
  const [mode, setMode] = useState<Mode>('quadratic');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Equation solver</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Solve polynomials up to degree 3 and linear systems, with on-screen keyboard support.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-lg border border-navy-200 p-1 dark:border-navy-700 w-fit">
        {(['linear', 'quadratic', 'cubic', 'system'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${
              mode === m ? 'bg-violet-600 text-white' : 'text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800'
            }`}
          >
            {m === 'linear' ? 'ax + b = 0' : m === 'quadratic' ? 'ax² + bx + c = 0' : m === 'cubic' ? 'ax³ + bx² + cx + d = 0' : '2×2 system'}
          </button>
        ))}
      </div>

      {mode === 'linear' && <LinearForm />}
      {mode === 'quadratic' && <QuadraticForm />}
      {mode === 'cubic' && <CubicForm />}
      {mode === 'system' && <SystemForm />}
    </div>
  );
}

// Reusable component for rendering results and saving to workspace
function ResultView({ result, variableNames }: { result: SolveResult; variableNames?: string[] }) {
  const { setVariable } = useWorkspace();

  if (!result.ok) {
    return <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{result.error}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-violet-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="label text-violet-700 dark:text-violet-300">Solution</div>
          {result.roots && result.roots.length > 0 && (
            <button 
              onClick={() => {
                result.roots?.forEach((r, i) => {
                  const name = variableNames && variableNames[i] ? variableNames[i] : (result.roots!.length > 1 ? `x${i+1}` : 'x');
                  setVariable(name, r.value);
                });
              }}
              className="btn-ghost px-2 py-1 text-xs text-violet-600 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900 flex items-center gap-1"
              title="Save solutions to Workspace"
            >
              <Database className="h-3 w-3" /> Save to Workspace
            </button>
          )}
        </div>
        <div className="font-mono text-lg text-violet-900 dark:text-violet-100">
          {result.roots && result.roots.length > 0
            ? result.roots.map((r, i) => (
                <div key={i}>
                  {variableNames && variableNames[i] ? variableNames[i] : (result.roots!.length > 1 ? `x${i + 1}` : 'x')} = {r.exact ?? r.value}
                </div>
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

// Floating Math Keyboard
function MathKeyboard({ 
  onInsert, 
  onBackspace 
}: { 
  onInsert: (val: string) => void; 
  onBackspace: () => void;
}) {
  const keys = [
    '7', '8', '9', '/', 'x',
    '4', '5', '6', '*', '^',
    '1', '2', '3', '-', '√',
    '0', '.', 'π', '+', '=',
  ];

  return (
    <div className="card p-3 space-y-2 bg-navy-50 dark:bg-navy-900/50">
      <div className="grid grid-cols-5 gap-1.5">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => onInsert(k)}
            className="key !h-10 text-sm bg-white dark:bg-navy-800"
          >
            {k}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => onInsert('(')} className="key !h-10 flex-1 bg-white dark:bg-navy-800 text-sm">(</button>
        <button onClick={() => onInsert(')')} className="key !h-10 flex-1 bg-white dark:bg-navy-800 text-sm">)</button>
        <button onClick={onBackspace} className="key !h-10 flex-1 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm">
          <Delete className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function LinearForm() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(5);
  const [r, setR] = useState<SolveResult | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeInput, setActiveInput] = useState<'a' | 'b'>('a');

  const handleInsert = (val: string) => {
    // Basic numeric keyboard only, no variables here
    if (activeInput === 'a') setA(Number(String(a) + val));
    if (activeInput === 'b') setB(Number(String(b) + val));
  };
  const handleBackspace = () => {
    if (activeInput === 'a') setA(Number(String(a).slice(0, -1)) || 0);
    if (activeInput === 'b') setB(Number(String(b).slice(0, -1)) || 0);
  };

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="label">a</span>
            <input type="number" className="input" value={a} onChange={(e) => setA(Number(e.target.value))} onFocus={() => setActiveInput('a')} />
          </label>
          <label className="space-y-1">
            <span className="label">b</span>
            <input type="number" className="input" value={b} onChange={(e) => setB(Number(e.target.value))} onFocus={() => setActiveInput('b')} />
          </label>
        </div>
        <button className="btn-primary w-full" onClick={() => setR(solveLinear(a, b))}>Solve a·x + b = 0</button>
      </div>
      <MathKeyboard onInsert={handleInsert} onBackspace={handleBackspace} />
      {r && <ResultView result={r} variableNames={['x']} />}
    </div>
  );
}

function QuadraticForm() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-5);
  const [c, setC] = useState(6);
  const [r, setR] = useState<SolveResult | null>(null);

  const [activeInput, setActiveInput] = useState<'a' | 'b' | 'c'>('a');
  const handleInsert = (val: string) => {
    if (activeInput === 'a') setA(Number(String(a) + val));
    if (activeInput === 'b') setB(Number(String(b) + val));
    if (activeInput === 'c') setC(Number(String(c) + val));
  };
  const handleBackspace = () => {
    if (activeInput === 'a') setA(Number(String(a).slice(0, -1)) || 0);
    if (activeInput === 'b') setB(Number(String(b).slice(0, -1)) || 0);
    if (activeInput === 'c') setC(Number(String(c).slice(0, -1)) || 0);
  };

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <label className="space-y-1"><span className="label">a</span><input type="number" className="input" value={a} onChange={(e) => setA(Number(e.target.value))} onFocus={() => setActiveInput('a')} /></label>
          <label className="space-y-1"><span className="label">b</span><input type="number" className="input" value={b} onChange={(e) => setB(Number(e.target.value))} onFocus={() => setActiveInput('b')} /></label>
          <label className="space-y-1"><span className="label">c</span><input type="number" className="input" value={c} onChange={(e) => setC(Number(e.target.value))} onFocus={() => setActiveInput('c')} /></label>
        </div>
        <button className="btn-primary w-full" onClick={() => setR(solveQuadratic(a, b, c))}>Solve</button>
      </div>
      <MathKeyboard onInsert={handleInsert} onBackspace={handleBackspace} />
      {r && <ResultView result={r} />}
    </div>
  );
}

// NEW: Cubic Solver
function CubicForm() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-6);
  const [c, setC] = useState(11);
  const [d, setD] = useState(-6);
  const [r, setR] = useState<SolveResult | null>(null);

  const solveCubic = () => {
    if (a === 0) {
      setR(solveQuadratic(b, c, d));
      return;
    }
    try {
      // mathjs polynomialRoot can solve this
      const expr = `${a} * x^3 + ${b} * x^2 + ${c} * x + ${d}`;
      const roots = math.polynomialRoot(a, b, c, d);
      
      const formattedRoots = roots.map((root: any) => {
        // mathjs returns Complex objects for complex roots
        if (typeof root === 'object' && root !== null && 're' in root && 'im' in root) {
          const re = root.re;
          const im = root.im;
          if (Math.abs(im) < 1e-10) return { value: re };
          return { value: re, exact: `${re.toFixed(4)} ${im > 0 ? '+' : '-'} ${Math.abs(im).toFixed(4)}i` };
        }
        return { value: root };
      });

      setR({
        ok: true,
        roots: formattedRoots,
        steps: [
          `Equation: ${a}x³ + ${b}x² + ${c}x + ${d} = 0`,
          'Using numerical polynomial root finding.',
        ]
      });
    } catch (e) {
      setR({ ok: false, error: 'Could not solve this cubic. Ensure coefficients are valid numbers.' });
    }
  };

  const [activeInput, setActiveInput] = useState<'a' | 'b' | 'c' | 'd'>('a');
  const handleInsert = (val: string) => {
    if (activeInput === 'a') setA(Number(String(a) + val));
    if (activeInput === 'b') setB(Number(String(b) + val));
    if (activeInput === 'c') setC(Number(String(c) + val));
    if (activeInput === 'd') setD(Number(String(d) + val));
  };
  const handleBackspace = () => {
    if (activeInput === 'a') setA(Number(String(a).slice(0, -1)) || 0);
    if (activeInput === 'b') setB(Number(String(b).slice(0, -1)) || 0);
    if (activeInput === 'c') setC(Number(String(c).slice(0, -1)) || 0);
    if (activeInput === 'd') setD(Number(String(d).slice(0, -1)) || 0);
  };

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="space-y-1"><span className="label">a</span><input type="number" className="input" value={a} onChange={(e) => setA(Number(e.target.value))} onFocus={() => setActiveInput('a')} /></label>
          <label className="space-y-1"><span className="label">b</span><input type="number" className="input" value={b} onChange={(e) => setB(Number(e.target.value))} onFocus={() => setActiveInput('b')} /></label>
          <label className="space-y-1"><span className="label">c</span><input type="number" className="input" value={c} onChange={(e) => setC(Number(e.target.value))} onFocus={() => setActiveInput('c')} /></label>
          <label className="space-y-1"><span className="label">d</span><input type="number" className="input" value={d} onChange={(e) => setD(Number(e.target.value))} onFocus={() => setActiveInput('d')} /></label>
        </div>
        <button className="btn-primary w-full" onClick={solveCubic}>Solve ax³ + bx² + cx + d = 0</button>
      </div>
      <MathKeyboard onInsert={handleInsert} onBackspace={handleBackspace} />
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
      <button className="btn-primary w-full" onClick={solve}>Solve</button>
      {r && <ResultView result={r} variableNames={['x', 'y']} />}
    </div>
  );
}