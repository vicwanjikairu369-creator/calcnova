import { useMemo, useState } from 'react';

function parseData(input: string): { values: number[]; error?: string } {
  const tokens = input.split(/[\s,;]+/).filter(Boolean);
  if (tokens.length === 0) return { values: [], error: 'Enter at least one number.' };
  const values: number[] = [];
  for (const t of tokens) {
    const n = Number(t);
    if (!Number.isFinite(n)) return { values: [], error: `"${t}" is not a valid number.` };
    values.push(n);
  }
  return { values };
}

function mean(xs: number[]) { return xs.reduce((a, b) => a + b, 0) / xs.length; }

function variance(xs: number[], sample: boolean) {
  const m = mean(xs);
  const ss = xs.reduce((a, b) => a + (b - m) ** 2, 0);
  return ss / (sample ? xs.length - 1 : xs.length);
}

export function Statistics() {
  const [input, setInput] = useState('2, 4, 4, 4, 5, 5, 7, 9');
  const [sample, setSample] = useState(true);

  const { values, error } = useMemo(() => parseData(input), [input]);

  const stats = useMemo(() => {
    if (error || values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const m = mean(values);
    const med = sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const counts = new Map<number, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    const modes = [...counts.entries()].filter(([, c]) => c === maxCount).map(([v]) => v);
    const v = variance(values, sample);
    return {
      sorted, mean: m, median: med, mode: modes, maxCount,
      range: sorted[sorted.length - 1] - sorted[0],
      variance: v, stddev: Math.sqrt(v),
      sum: values.reduce((a, b) => a + b, 0),
      count: values.length,
    };
  }, [values, error, sample]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Summary statistics with population and sample spread.
        </p>
      </header>

      <div className="card p-4 space-y-3">
        <label className="space-y-1 block">
          <span className="label">Data (comma, space or newline separated)</span>
          <textarea className="input font-mono min-h-24" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Data values" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-navy-200 p-0.5 dark:border-navy-700">
            <button onClick={() => setSample(true)} aria-pressed={sample} className={`px-3 py-1 text-xs rounded-md ${sample ? 'bg-violet-600 text-white' : ''}`}>Sample</button>
            <button onClick={() => setSample(false)} aria-pressed={!sample} className={`px-3 py-1 text-xs rounded-md ${!sample ? 'bg-violet-600 text-white' : ''}`}>Population</button>
          </div>
          <span className="text-xs text-navy-400">
            {sample
              ? 'Sample: divides by (n − 1). Use when your data is a subset of a larger population.'
              : 'Population: divides by n. Use when you have every value of interest.'}
          </span>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Count" value={String(stats.count)} />
          <Stat label="Sum" value={stats.sum.toFixed(6)} />
          <Stat label="Mean" value={stats.mean.toFixed(6)} />
          <Stat label="Median" value={stats.median.toFixed(6)} />
          <Stat label="Mode" value={stats.mode.length === stats.count ? 'no mode' : stats.mode.join(', ')} />
          <Stat label="Range" value={stats.range.toFixed(6)} />
          <Stat label="Variance" value={stats.variance.toFixed(6)} />
          <Stat label="Std deviation" value={stats.stddev.toFixed(6)} />
          <div className="card p-3 sm:col-span-2">
            <div className="label">Sorted data</div>
            <div className="mt-1 font-mono text-sm break-all">{stats.sorted.join(', ')}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="label">{label}</div>
      <div className="mt-1 font-mono text-lg">{value}</div>
    </div>
  );
}