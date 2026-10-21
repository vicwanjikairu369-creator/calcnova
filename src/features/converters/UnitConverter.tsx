import { useMemo, useState } from 'react';
import { ArrowRightLeft, Copy } from 'lucide-react';
import { CATEGORIES, convert, type Category } from '@/lib/units';
import { useHistory } from '@/hooks/useHistory';
import { Toast } from '@/components/ui/Toast';

export function UnitConverter() {
  const [cat, setCat] = useState<Category>(CATEGORIES[0]);
  const [fromId, setFromId] = useState(cat.units[0].id);
  const [toId, setToId] = useState(cat.units[1].id);
  const [input, setInput] = useState('1');
  const [toast, setToast] = useState<string | null>(null);
  const { addHistory } = useHistory();

  const numeric = Number(input.replace(/,/g, ''));
  const valid = Number.isFinite(numeric);

  const out = useMemo(() => {
    if (!valid) return '—';
    try {
      const v = convert(numeric, fromId, toId, cat);
      const from = cat.units.find((u) => u.id === fromId);
      const to = cat.units.find((u) => u.id === toId);
      return `${v.toLocaleString(undefined, { maximumSignificantDigits: 12 })} ${to?.symbol ?? ''}`.trim();
    } catch { return '—'; }
  }, [numeric, fromId, toId, cat, valid]);

  const onCategory = (c: Category) => {
    setCat(c);
    setFromId(c.units[0].id);
    setToId(c.units[1]?.id ?? c.units[0].id);
  };

  const swap = () => { setFromId(toId); setToId(fromId); };

  const copy = async () => {
    try { await navigator.clipboard.writeText(out); setToast('Copied'); }
    catch { setToast('Copy failed'); }
  };

  const saveToHistory = () => {
    if (!valid) return;
    const from = cat.units.find((u) => u.id === fromId);
    const to = cat.units.find((u) => u.id === toId);
    addHistory(`${numeric} ${from?.symbol} → ${to?.symbol}`, out, 'Converter');
    setToast('Saved to history');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Unit converter</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Precise conversions across {CATEGORIES.length} categories.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => onCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              cat.id === c.id
                ? 'bg-violet-600 text-white'
                : 'bg-navy-100 text-navy-700 hover:bg-navy-200 dark:bg-navy-800 dark:text-navy-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr,auto,1fr]">
          <div className="space-y-1">
            <span className="label">From</span>
            <input className="input text-lg font-mono" value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" aria-label="Value to convert" />
            <select className="input" value={fromId} onChange={(e) => setFromId(e.target.value)} aria-label="From unit">
              {cat.units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
            </select>
          </div>
          <div className="flex items-center justify-center">
            <button onClick={swap} className="btn-soft rounded-full" aria-label="Swap units"><ArrowRightLeft className="h-4 w-4" aria-hidden /></button>
          </div>
          <div className="space-y-1">
            <span className="label">To</span>
            <div className="input text-lg font-mono truncate" aria-live="polite">{out}</div>
            <select className="input" value={toId} onChange={(e) => setToId(e.target.value)} aria-label="To unit">
              {cat.units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
            </select>
          </div>
        </div>

        {!valid && <p className="text-xs text-red-500">Enter a valid number.</p>}

        <div className="flex gap-2">
          <button className="btn-soft flex-1" onClick={copy}><Copy className="h-4 w-4" aria-hidden /> Copy</button>
          <button className="btn-primary flex-1" onClick={saveToHistory}>Save to history</button>
        </div>

        <details className="text-xs text-navy-500 dark:text-navy-400">
          <summary className="cursor-pointer">About these units</summary>
          <p className="mt-2">
            Data units distinguish decimal (kB = 10³ B) from binary (KiB = 2¹⁰ B). Mass here refers to
            gravitational mass; force units such as newtons are not included in this category.
          </p>
        </details>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}