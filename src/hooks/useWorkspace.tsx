import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface WorkspaceContextType {
  variables: Record<string, number>;
  setVariable: (key: string, value: number) => void;
  removeVariable: (key: string) => void;
  clearWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const STORAGE_KEY = 'calcnova:workspace:v1';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [variables, setVariables] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore corrupted storage
    }
    return {};
  });

  // Persist to localStorage whenever variables change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(variables));
    } catch {
      // Ignore quota errors
    }
  }, [variables]);

  const setVariable = (key: string, value: number) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const removeVariable = (key: string) => {
    setVariables((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const clearWorkspace = () => {
    setVariables({});
  };

  const value = useMemo(
    () => ({ variables, setVariable, removeVariable, clearWorkspace }),
    [variables]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}