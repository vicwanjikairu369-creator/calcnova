import { useMemo, useState } from 'react';
import { Copy, Trash2, Search, Save, Bookmark } from 'lucide-react';
import { useHistory } from '@/hooks/useHistory';
import { Toast } from '@/components/ui/Toast';

export function HistoryPage() {
  const { history, removeHistory, clearHistory, notebook, addNotebook, renameNotebook, deleteNotebook } = useHistory();
  const [q, setQ] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveExpr, setSaveExpr] = useState('');
  const [saveResult, setSaveResult] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return history;
    return history.filter((h) => h.expression.toLowerCase().includes(s) || h.result.toLowerCase().includes(s));
  }, [history, q]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setToast('Copied'); }
    catch { setToast('Copy failed'); }
  };

  const exportJson = () => {
    const data = JSON.stringify({ history, notebook, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `calcnova-export-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">History & notebook</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">
          Everything is stored on this device only — it will not sync across devices.
        </p>
      </header>

      <section className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden />
            <input className="input pl-9" placeholder="Search history…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search history" />
          </div>
          <button className="btn-soft" onClick={exportJson}><Save className="h-4 w-4" aria-hidden /> Export</button>
          <button className="btn-soft" onClick={() => setConfirmClear(true)} aria-label="Clear all history"><Trash2 className="h-4 w-4" aria-hidden /> Clear</button>
        </div>

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-navy-400">No history yet. Results from any calculator will appear here.</p>
        ) : (
          <ul className="divide-y divide-navy-100 dark:divide-navy-800">
            {filtered.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm truncate">{h.expression}</div>
                  <div className="font-mono text-sm font-semibold text-violet-700 dark:text-violet-300 truncate">= {h.result}</div>
                  <div className="text-[11px] text-navy-400">
                    {new Date(h.timestamp).toLocaleString()}{h.source ? ` · ${h.source}` : ''}
                  </div>
                </div>
                <button className="btn-ghost p-1.5" onClick={() => copy(h.result)} aria-label="Copy result"><Copy className="h-4 w-4" aria-hidden /></button>
                <button className="btn-ghost p-1.5" onClick={() => removeHistory(h.id)} aria-label="Delete entry"><Trash2 className="h-4 w-4 text-red-500" aria-hidden /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Bookmark className="h-4 w-4" aria-hidden /> Notebook</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr,1fr,1fr,auto]">
          <input className="input" placeholder="Name" value={saveName} onChange={(e) => setSaveName(e.target.value)} aria-label="Note name" />
          <input className="input font-mono" placeholder="Expression" value={saveExpr} onChange={(e) => setSaveExpr(e.target.value)} aria-label="Expression" />
          <input className="input font-mono" placeholder="Result" value={saveResult} onChange={(e) => setSaveResult(e.target.value)} aria-label="Result" />
          <button
            className="btn-primary"
            onClick={() => {
              if (!saveName.trim()) return;
              addNotebook(saveName.trim(), saveExpr, saveResult);
              setSaveName(''); setSaveExpr(''); setSaveResult('');
              setToast('Saved');
            }}
          >
            Save
          </button>
        </div>
        {notebook.length === 0 ? (
          <p className="py-4 text-center text-sm text-navy-400">No saved notes yet.</p>
        ) : (
          <ul className="divide-y divide-navy-100 dark:divide-navy-800">
            {notebook.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <input
                  className="input max-w-xs"
                  value={n.name}
                  onChange={(e) => renameNotebook(n.id, e.target.value)}
                  aria-label="Rename note"
                />
                <div className="min-w-0 flex-1 font-mono text-sm text-navy-500 dark:text-navy-400 truncate">
                  {n.expression} = {n.result}
                </div>
                <button className="btn-ghost p-1.5" onClick={() => deleteNotebook(n.id)} aria-label="Delete note"><Trash2 className="h-4 w-4 text-red-500" aria-hidden /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4" role="dialog" aria-modal="true">
          <div className="card max-w-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold">Clear all history?</h3>
            <p className="text-sm text-navy-500 dark:text-navy-400">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn-soft" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => { clearHistory(); setConfirmClear(false); setToast('History cleared'); }}>Clear</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}