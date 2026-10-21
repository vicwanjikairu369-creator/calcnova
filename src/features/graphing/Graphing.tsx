import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { evaluateExpression } from '@/lib/math/evaluate';

interface Eq {
  id: string;
  expr: string;
  color: string;
  visible: boolean;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899'];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/** Safely evaluate y(x) — returns null if the result isn't a finite number. */
function evalAt(expr: string, x: number): number | null {
  if (!expr.trim()) return null;
  const r = evaluateExpression(expr, { scope: { x } });
  if (!r.ok) return null;
  if (typeof r.value === 'number') return Number.isFinite(r.value) ? r.value : null;
  if (typeof r.value === 'string') {
    const n = Number(r.value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isDark(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

export function Graphing() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const [equations, setEquations] = useState<Eq[]>([
    { id: uid(), expr: 'x^2 - 3', color: COLORS[0], visible: true },
  ]);
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  const [parseError, setParseError] = useState<string | null>(null);
  const [tableX, setTableX] = useState(0);

  // ---- 1. Track container size with ResizeObserver so canvas is never 0×0 ----
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // ---- 2. Validate each equation and surface a useful message ----
  useEffect(() => {
    for (const eq of equations) {
      if (!eq.expr.trim()) continue;
      const r = evaluateExpression(eq.expr, { scope: { x: 1 } });
      if (!r.ok) {
        setParseError(`${eq.expr} → ${r.error}`);
        return;
      }
    }
    setParseError(null);
  }, [equations]);

  // ---- 3. Draw whenever anything changes ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = size.w;
    const H = size.h;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const xToPx = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const yToPx = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;

    const dark = isDark();
    ctx.fillStyle = dark ? '#080d18' : '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Grid
    const xStep = niceStep(xMax - xMin);
    const yStep = niceStep(yMax - yMin);
    ctx.strokeStyle = dark ? 'rgba(148,163,184,0.14)' : 'rgba(100,116,139,0.14)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const px = xToPx(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const py = yToPx(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = dark ? 'rgba(148,163,184,0.6)' : 'rgba(71,85,105,0.6)';
    ctx.lineWidth = 1.5;
    if (yMin <= 0 && yMax >= 0) {
      const py = yToPx(0);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }
    if (xMin <= 0 && xMax >= 0) {
      const px = xToPx(0);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }

    // Tick labels
    ctx.fillStyle = dark ? 'rgba(148,163,184,0.85)' : 'rgba(71,85,105,0.85)';
    ctx.font = '10px system-ui, sans-serif';
    const xDec = Math.max(0, -Math.floor(Math.log10(xStep)));
    const yDec = Math.max(0, -Math.floor(Math.log10(yStep)));
    const yAxisRow = yMin <= 0 && yMax >= 0 ? yToPx(0) : H - 2;
    const xAxisCol = xMin <= 0 && xMax >= 0 ? xToPx(0) : 2;
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) < 1e-9) continue;
      ctx.fillText(x.toFixed(xDec), xToPx(x) + 2, yAxisRow + 11);
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) < 1e-9) continue;
      ctx.fillText(y.toFixed(yDec), xAxisCol + 4, yToPx(y) - 2);
    }

    // Plot each visible equation
    const samples = Math.max(400, Math.floor(W));
    for (const eq of equations) {
      if (!eq.visible || !eq.expr.trim()) continue;

      ctx.strokeStyle = eq.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let penDown = false;
      let prevPy: number | null = null;

      for (let i = 0; i <= samples; i++) {
        const x = xMin + ((xMax - xMin) * i) / samples;
        const y = evalAt(eq.expr, x);

        if (y === null) {
          penDown = false;
          prevPy = null;
          continue;
        }

        const px = xToPx(x);
        const py = yToPx(y);

        if (!Number.isFinite(px) || !Number.isFinite(py)) {
          penDown = false;
          prevPy = null;
          continue;
        }

        // Detect vertical asymptotes: a huge jump in pixel space
        if (prevPy !== null && Math.abs(py - prevPy) > H * 3) {
          penDown = false;
        }

        if (!penDown) {
          ctx.moveTo(px, py);
          penDown = true;
        } else {
          ctx.lineTo(px, py);
        }
        prevPy = py;
      }
      ctx.stroke();
    }
  }, [equations, xMin, xMax, yMin, yMax, size]);

  const addEq = () => {
    setEquations((prev) => [
      ...prev,
      { id: uid(), expr: '', color: COLORS[prev.length % COLORS.length], visible: true },
    ]);
  };
  const update = (id: string, patch: Partial<Eq>) =>
    setEquations((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) => setEquations((prev) => prev.filter((e) => e.id !== id));

  const zoom = (factor: number) => {
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    const hw = ((xMax - xMin) / 2) * factor;
    const hh = ((yMax - yMin) / 2) * factor;
    setXMin(cx - hw);
    setXMax(cx + hw);
    setYMin(cy - hh);
    setYMax(cy + hh);
  };

  const reset = () => {
    setXMin(-10);
    setXMax(10);
    setYMin(-10);
    setYMax(10);
  };

  const table = useMemo(() => {
    const rows: { x: number; y: string }[] = [];
    const first = equations.find((e) => e.visible && e.expr.trim());
    for (let i = -3; i <= 3; i++) {
      const x = tableX + i;
      if (!first) {
        rows.push({ x, y: '—' });
        continue;
      }
      const y = evalAt(first.expr, x);
      rows.push({ x, y: y === null ? '—' : String(Number(y.toPrecision(8))) });
    }
    return rows;
  }, [equations, tableX]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Graphing calculator</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Plot multiple equations of <span className="font-mono">x</span> on one canvas.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <div className="space-y-3">
          <div className="card p-3 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-navy-400">
              Equations
            </div>
            {equations.map((eq) => (
              <div key={eq.id} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: eq.color }}
                  aria-hidden
                />
                <span className="shrink-0 font-mono text-xs text-navy-500">y =</span>
                <input
                  value={eq.expr}
                  onChange={(e) => update(eq.id, { expr: e.target.value })}
                  placeholder="x^2 + 3x + 2"
                  aria-label="Equation in x"
                  className="input py-1 text-sm font-mono"
                />
                <button
                  onClick={() => update(eq.id, { visible: !eq.visible })}
                  className="btn-ghost p-1"
                  aria-label={eq.visible ? 'Hide equation' : 'Show equation'}
                >
                  {eq.visible ? (
                    <Eye className="h-4 w-4" aria-hidden />
                  ) : (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  )}
                </button>
                <button
                  onClick={() => remove(eq.id)}
                  className="btn-ghost p-1"
                  aria-label="Delete equation"
                >
                  <Trash2 className="h-4 w-4 text-red-500" aria-hidden />
                </button>
              </div>
            ))}
            <button onClick={addEq} className="btn-soft w-full text-xs">
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add equation
            </button>
            {parseError && (
              <p className="text-xs text-red-500 break-all">Syntax error: {parseError}</p>
            )}
          </div>

          <div className="card p-3 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-navy-400">Range</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="space-y-1">
                <span className="label">x min</span>
                <input
                  className="input py-1"
                  type="number"
                  value={xMin}
                  onChange={(e) => setXMin(Number(e.target.value))}
                />
              </label>
              <label className="space-y-1">
                <span className="label">x max</span>
                <input
                  className="input py-1"
                  type="number"
                  value={xMax}
                  onChange={(e) => setXMax(Number(e.target.value))}
                />
              </label>
              <label className="space-y-1">
                <span className="label">y min</span>
                <input
                  className="input py-1"
                  type="number"
                  value={yMin}
                  onChange={(e) => setYMin(Number(e.target.value))}
                />
              </label>
              <label className="space-y-1">
                <span className="label">y max</span>
                <input
                  className="input py-1"
                  type="number"
                  value={yMax}
                  onChange={(e) => setYMax(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="flex gap-1.5">
              <button className="btn-soft flex-1 text-xs" onClick={() => zoom(0.7)}>
                <ZoomIn className="h-3.5 w-3.5" aria-hidden />In
              </button>
              <button className="btn-soft flex-1 text-xs" onClick={() => zoom(1.4)}>
                <ZoomOut className="h-3.5 w-3.5" aria-hidden />Out
              </button>
              <button className="btn-soft flex-1 text-xs" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />Reset
              </button>
            </div>
          </div>

          <div className="card p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                Table
              </div>
              <input
                type="number"
                value={tableX}
                onChange={(e) => setTableX(Number(e.target.value))}
                className="input w-20 py-0.5 text-xs"
                aria-label="Table centre x"
              />
            </div>
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="text-navy-400">
                  <th className="text-left">x</th>
                  <th className="text-right">y</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r) => (
                  <tr key={r.x}>
                    <td>{r.x}</td>
                    <td className="text-right">{r.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-navy-400">
              Uses the first visible equation.
            </p>
          </div>
        </div>

        <div
          ref={wrapRef}
          className="card overflow-hidden"
          style={{ height: 480 }}
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full"
            role="img"
            aria-label="Graph of the equations"
          />
        </div>
      </div>
    </div>
  );
}

function niceStep(range: number): number {
  const rough = range / 10;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * pow;
}