'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { AgentStatus } from '@/types';

interface AgentContextValue {
  status: AgentStatus;
  currentModel: string;
  modelList: string[];
  setStatus: (status: AgentStatus) => void;
  setCurrentModel: (model: string) => void;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

// Mock initial values per PRD implementation notes
const MOCK_MODEL_LIST = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'gpt-4o',
  'gpt-4o-mini',
];

interface AgentProviderProps {
  children: ReactNode;
}

export function AgentProvider({ children }: AgentProviderProps) {
  const [status, setStatusState] = useState<AgentStatus>('idle');
  const [currentModel, setCurrentModelState] = useState<string>(MOCK_MODEL_LIST[0]);

  const setStatus = useCallback((newStatus: AgentStatus) => {
    setStatusState(newStatus);
  }, []);

  const setCurrentModel = useCallback((model: string) => {
    setCurrentModelState(model);
  }, []);

  const value: AgentContextValue = {
    status,
    currentModel,
    modelList: MOCK_MODEL_LIST,
    setStatus,
    setCurrentModel,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
