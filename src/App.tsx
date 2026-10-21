import { Suspense, useCallback, useState } from 'react';
import { Layout } from '@/components/Layout';
import { SettingsProvider } from '@/hooks/useSettings';
import { HistoryProvider, useHistory } from '@/hooks/useHistory';
import { BasicCalculator } from '@/features/basic/BasicCalculator';
import { ScientificCalculator } from '@/features/scientific/ScientificCalculator';
import { Graphing } from '@/features/graphing/Graphing';
import { EquationSolver } from '@/features/equations/EquationSolver';
import { Calculus } from '@/features/calculus/Calculus';
import { Finance } from '@/features/finance/Finance';
import { UnitConverter } from '@/features/converters/UnitConverter';
import { Statistics } from '@/features/stats/Statistics';
import { Programmer } from '@/features/programmer/Programmer';
import { Utilities } from '@/features/utilities/Utilities';
import { HistoryPage } from '@/features/history/HistoryPage';
import { Assistant } from '@/features/assistant/Assistant';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { Home } from '@/features/home/Home';
import { TOOLS } from '@/app/tools';

function Shell() {
  const [tool, setTool] = useState<string>('home');
  const { pushRecent } = useHistory();

  const open = useCallback(
    (id: string) => {
      setTool(id);
      if (id !== 'home') pushRecent(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [pushRecent],
  );

  const navigate = (id: string) => open(id);

  const onSearch = (q: string) => {
    const s = q.trim().toLowerCase();
    if (!s) return;
    const first = Object.values(TOOLS).find((t) =>
      [t.name, ...(t.keywords ?? [])].join(' ').toLowerCase().includes(s),
    );
    if (first) navigate(first.id);
  };

  return (
    <Layout currentTool={tool} onNavigate={navigate} onSearch={onSearch}>
      <Suspense fallback={<div className="text-sm text-navy-400">Loading…</div>}>
        {tool === 'home' && <Home onOpen={open} />}
        {tool === 'basic' && <BasicCalculator />}
        {tool === 'scientific' && <ScientificCalculator />}
        {tool === 'graphing' && <Graphing />}
        {tool === 'equations' && <EquationSolver />}
        {tool === 'calculus' && <Calculus />}
        {tool === 'finance' && <Finance />}
        {tool === 'converter' && <UnitConverter />}
        {tool === 'stats' && <Statistics />}
        {tool === 'programmer' && <Programmer />}
        {tool === 'utilities' && <Utilities />}
        {tool === 'history' && <HistoryPage />}
        {tool === 'assistant' && <Assistant />}
        {tool === 'settings' && <SettingsPage />}
        {!TOOLS[tool] && tool !== 'home' && (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold">Not found</h2>
            <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
              That calculator does not exist.
            </p>
            <button className="btn-primary mt-4" onClick={() => navigate('home')}>
              Go home
            </button>
          </div>
        )}
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <HistoryProvider>
        <Shell />
      </HistoryProvider>
    </SettingsProvider>
  );
}