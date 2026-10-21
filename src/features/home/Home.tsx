import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { TOOLS, searchTools } from '@/app/tools';
import { useHistory } from '@/hooks/useHistory';
import { formatNumber } from '@/lib/math/format';

export function Home({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState('');
  const { recent, history } = useHistory();

  const results = useMemo(() => (q.trim() ? searchTools(q) : []), [q]);

  const categories = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const t of Object.values(TOOLS)) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t.id);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">One platform. Every calculation.</h1>
        <p className="text-navy-500 dark:text-navy-400 max-w-2xl">
          A precise, private calculator workspace: basic and scientific maths, graphing, equations,
          finance, converters, statistics and programmer tools.
        </p>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" aria-hidden />
          <input
            className="input pl-10 py-3 text-base"
            placeholder="Search calculators… try 'loan', 'matrix' or 'trig'"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search calculators"
          />
        </div>
        {results.length > 0 && (
          <ul className="card divide-y divide-navy-100 dark:divide-navy-800 max-w-xl">
            {results.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.id}>
                  <button onClick={() => onOpen(t.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-navy-50 dark:hover:bg-navy-800">
                    <Icon className="h-5 w-5 text-violet-600" aria-hidden />
                    <div>
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-navy-500 dark:text-navy-400">{t.description}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-400">Recent tools</h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((id) => TOOLS[id]).filter(Boolean).map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => onOpen(t.id)} className="btn-soft">
                  <Icon className="h-4 w-4" aria-hidden /> {t.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-400">Recent calculations</h2>
          <ul className="card divide-y divide-navy-100 dark:divide-navy-800">
            {history.slice(0, 5).map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="font-mono text-sm truncate">{h.expression}</span>
                <span className="ml-auto font-mono text-sm text-violet-700 dark:text-violet-300">= {h.result}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {categories.map(([cat, ids]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-400">{cat}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ids.map((id) => {
              const t = TOOLS[id];
              const Icon = t.icon;
              return (
                <button key={id} onClick={() => onOpen(id)} className="card p-4 text-left transition-shadow hover:shadow-glow">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-violet-600" aria-hidden />
                    <div className="font-medium">{t.name}</div>
                  </div>
                  <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">{t.description}</p>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <p className="text-xs text-navy-400">
        Suggested starting values: try <code>15% of 2400</code> in Utilities,{' '}
        <code>2x + 5 = 17</code> in the linear solver, or <code>1 km → m</code> in the converter.
        Result formatting uses up to 12 significant digits by default — see Settings to change.
      </p>
    </div>
  );
}