import { Suspense, useCallback, useState } from 'react';
import { Layout } from '@/components/Layout';
import { SettingsProvider } from '@/hooks/useSettings';
import { HistoryProvider, useHistory } from '@/hooks/useHistory';
import { WorkspaceProvider } from '@/hooks/useWorkspace'; // NEW
import { Calculator } from '@/features/calculator/Calculator'; // NEW unified calc
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

  return (
    <Layout currentTool={tool} onNavigate={navigate}>
      <Suspense fallback={<div className="text-sm text-navy-400">Loading…</div>}>
        {tool === 'home' && <Home onOpen={open} />}
        
        {/* Unified Calculator replaces Basic and Scientific */}
        {tool === 'calculator' && <Calculator />}
        
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
        <WorkspaceProvider> {/* NEW: Wraps the app for cross-tool memory */}
          <Shell />
        </WorkspaceProvider>
      </HistoryProvider>
    </SettingsProvider>
  );
}