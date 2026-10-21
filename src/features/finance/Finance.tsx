import { useState } from 'react';
import { formatNumber } from '@/lib/math/format';
import { useHistory } from '@/hooks/useHistory';

type Mode = 'simple' | 'compound' | 'loan' | 'margin' | 'vat';

export function Finance() {
  const [mode, setMode] = useState<Mode>('compound');
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Finance</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Interest, loans, margins and VAT — every result shows the formula used.
        </p>
      </header>
      <div className="flex flex-wrap gap-1 rounded-lg border border-navy-200 p-1 dark:border-navy-700 w-fit">
        {([
          ['simple', 'Simple interest'],
          ['compound', 'Compound interest'],
          ['loan', 'Loan payment'],
          ['margin', 'Profit margin'],
          ['vat', 'VAT'],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${
              mode === m ? 'bg-violet-600 text-white' : 'text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800'
            }`}
          >{label}</button>
        ))}
      </div>
      {mode === 'simple' && <SimpleInterest />}
      {mode === 'compound' && <CompoundInterest />}
      {mode === 'loan' && <LoanPayment />}
      {mode === 'margin' && <Margin />}
      {mode === 'vat' && <VAT />}
    </div>
  );
}

function Money({ v }: { v: number }) {
  return <span className="font-mono">{formatNumber(v, { precision: 10, thousands: true })}</span>;
}

function SimpleInterest() {
  const [p, setP] = useState(1000);
  const [r, setR] = useState(5);
  const [t, setT] = useState(3);
  const interest = (p * r * t) / 100;
  const total = p + interest;
  const { addHistory } = useHistory();
  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1"><span className="label">Principal</span><input type="number" className="input" value={p} onChange={(e) => setP(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Rate (% per year)</span><input type="number" className="input" value={r} onChange={(e) => setR(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Time (years)</span><input type="number" className="input" value={t} onChange={(e) => setT(Number(e.target.value))} /></label>
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60">
        <div>Interest = P·r·t/100 = {p}·{r}·{t}/100 = <strong><Money v={interest} /></strong></div>
        <div className="mt-1">Total = P + Interest = <strong><Money v={total} /></strong></div>
      </div>
      <button className="btn-soft text-xs" onClick={() => addHistory(`Simple interest P=${p} r=${r}% t=${t}y`, `Interest ${interest.toFixed(2)}, Total ${total.toFixed(2)}`, 'Finance')}>
        Save to history
      </button>
    </div>
  );
}

function CompoundInterest() {
  const [p, setP] = useState(1000);
  const [r, setR] = useState(5);
  const [t, setT] = useState(10);
  const [n, setN] = useState(12);
  const amount = p * Math.pow(1 + r / 100 / n, n * t);
  const interest = amount - p;
  const { addHistory } = useHistory();
  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="space-y-1"><span className="label">Principal</span><input type="number" className="input" value={p} onChange={(e) => setP(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Rate %/yr</span><input type="number" className="input" value={r} onChange={(e) => setR(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Years</span><input type="number" className="input" value={t} onChange={(e) => setT(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Compounds/yr</span><input type="number" className="input" value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60">
        <div>A = P(1 + r/n)<sup>nt</sup> = {p}(1 + {r}/100/{n})<sup>{n}·{t}</sup></div>
        <div className="mt-1">Amount = <strong><Money v={amount} /></strong></div>
        <div>Interest earned = <strong><Money v={interest} /></strong></div>
      </div>
      <button className="btn-soft text-xs" onClick={() => addHistory(`Compound P=${p} r=${r}% t=${t}y n=${n}`, `A=${amount.toFixed(2)}`, 'Finance')}>
        Save to history
      </button>
    </div>
  );
}

function LoanPayment() {
  const [p, setP] = useState(200000);
  const [r, setR] = useState(5);
  const [years, setYears] = useState(30);
  const monthly = (r / 100) / 12;
  const n = years * 12;
  const payment = monthly === 0 ? p / n : (p * monthly) / (1 - Math.pow(1 + monthly, -n));
  const total = payment * n;
  const interest = total - p;

  // Amortisation preview
  const rows: { month: number; interest: number; principal: number; balance: number }[] = [];
  let bal = p;
  for (let i = 0; i < Math.min(n, 12); i++) {
    const int = bal * monthly;
    const princ = payment - int;
    bal = bal - princ;
    rows.push({ month: i + 1, interest: int, principal: princ, balance: Math.max(bal, 0) });
  }
  const { addHistory } = useHistory();

  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1"><span className="label">Loan amount</span><input type="number" className="input" value={p} onChange={(e) => setP(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Annual rate %</span><input type="number" className="input" value={r} onChange={(e) => setR(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Term (years)</span><input type="number" className="input" value={years} onChange={(e) => setYears(Number(e.target.value))} /></label>
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60 space-y-1">
        <div>Monthly payment = <strong><Money v={payment} /></strong></div>
        <div>Total paid = <strong><Money v={total} /></strong></div>
        <div>Total interest = <strong><Money v={interest} /></strong></div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-navy-600 dark:text-navy-300">First 12 payments (amortisation preview)</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-navy-400">
              <tr><th className="text-left">#</th><th className="text-right">Interest</th><th className="text-right">Principal</th><th className="text-right">Balance</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td className="text-right">{row.interest.toFixed(2)}</td>
                  <td className="text-right">{row.principal.toFixed(2)}</td>
                  <td className="text-right">{row.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-navy-400">Showing the first 12 months only — this is a preview, not the full schedule.</p>
      </details>
      <button className="btn-soft text-xs" onClick={() => addHistory(`Loan P=${p} r=${r}% ${years}y`, `Monthly ${payment.toFixed(2)}`, 'Finance')}>
        Save to history
      </button>
    </div>
  );
}

function Margin() {
  const [cost, setCost] = useState(50);
  const [revenue, setRevenue] = useState(80);
  const profit = revenue - cost;
  const margin = revenue !== 0 ? (profit / revenue) * 100 : NaN;
  const markup = cost !== 0 ? (profit / cost) * 100 : NaN;
  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1"><span className="label">Cost</span><input type="number" className="input" value={cost} onChange={(e) => setCost(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Revenue</span><input type="number" className="input" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} /></label>
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60 space-y-1">
        <div>Profit = Revenue − Cost = <strong><Money v={profit} /></strong></div>
        <div>Profit margin = Profit / Revenue × 100 = <strong>{Number.isFinite(margin) ? margin.toFixed(2) + '%' : '—'}</strong></div>
        <div>Markup = Profit / Cost × 100 = <strong>{Number.isFinite(markup) ? markup.toFixed(2) + '%' : '—'}</strong></div>
      </div>
    </div>
  );
}

function VAT() {
  const [amount, setAmount] = useState(100);
  const [rate, setRate] = useState(20);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const gross = mode === 'add' ? amount * (1 + rate / 100) : amount;
  const net = mode === 'add' ? amount : amount / (1 + rate / 100);
  const vat = gross - net;
  return (
    <div className="card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1"><span className="label">Amount</span><input type="number" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Rate %</span><input type="number" className="input" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="label">Mode</span>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as 'add' | 'remove')}>
            <option value="add">Add VAT</option>
            <option value="remove">Remove VAT</option>
          </select>
        </label>
      </div>
      <div className="rounded-lg bg-navy-50 p-3 text-sm dark:bg-navy-950/60 space-y-1">
        <div>Net = <strong><Money v={net} /></strong></div>
        <div>VAT = <strong><Money v={vat} /></strong></div>
        <div>Gross = <strong><Money v={gross} /></strong></div>
      </div>
    </div>
  );
}