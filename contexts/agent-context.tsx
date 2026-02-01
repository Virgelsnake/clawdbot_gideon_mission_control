'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { AgentStatus } from '@/types';
import { fetchModels, fetchStatus, requestModelSwap } from '@/lib/api/agent';

interface AgentContextValue {
  status: AgentStatus;
  connected: boolean;
  currentModel: string;
  modelList: string[];
  setStatus: (status: AgentStatus) => void;
  setCurrentModel: (model: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

interface AgentProviderProps {
  children: ReactNode;
}

export function AgentProvider({ children }: AgentProviderProps) {
  const [status, setStatusState] = useState<AgentStatus>('idle');
  const [connected, setConnected] = useState<boolean>(false);
  const [modelList, setModelList] = useState<string[]>(['default']);
  const [currentModel, setCurrentModelState] = useState<string>('default');

  const setStatus = useCallback((newStatus: AgentStatus) => {
    setStatusState(newStatus);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [modelsRes, statusRes] = await Promise.all([fetchModels(), fetchStatus()]);
      setConnected(Boolean(statusRes?.connected));

      const ids = (modelsRes?.models || []).map((m) => m.id).filter(Boolean);
      if (ids.length) {
        setModelList(ids);
        // Keep currentModel stable if it still exists; otherwise fall back.
        setCurrentModelState((prev) => (ids.includes(prev) ? prev : ids[0]));
      }
    } catch {
      setConnected(false);
    }
  }, []);

  // On mount: load models + connectivity.
  useEffect(() => {
    // Defer to avoid react-hooks/set-state-in-effect lint rule.
    const initial = setTimeout(() => {
      void refresh();
    }, 0);

    // Poll status lightly so the UI can show disconnected state.
    const t = setInterval(() => {
      void refresh();
    }, 15_000);

    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, [refresh]);

  const setCurrentModel = useCallback(
    async (model: string) => {
      setCurrentModelState(model);
      try {
        await requestModelSwap(model);
      } catch {
        // If swap fails, we still keep the UI-selected model as the "requested" model.
        // The chat may error if the gateway refuses.
      }
    },
    []
  );

  const value: AgentContextValue = {
    status,
    connected,
    currentModel,
    modelList,
    setStatus,
    setCurrentModel,
    refresh,
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
