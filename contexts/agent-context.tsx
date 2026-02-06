'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import type { AgentStatus, AgentState } from '@/types';
import { fetchModels, fetchStatus, requestModelSwitch } from '@/lib/api/agent';
import { fetchAgentState, subscribeAgentState } from '@/lib/supabase/agent-state';

// UI-only display status — extends AgentStatus with 'disconnected'
export type DisplayStatus = AgentStatus | 'disconnected';

const HEARTBEAT_TIMEOUT_MS = 60_000; // 60 seconds

interface AgentContextValue {
  status: AgentStatus;
  displayStatus: DisplayStatus;
  connected: boolean;
  currentModel: string;
  modelList: string[];
  lastHeartbeat: string | undefined;
  setStatus: (status: AgentStatus) => void;
  setCurrentModel: (model: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

interface AgentProviderProps {
  children: ReactNode;
}

function isHeartbeatStale(lastHeartbeat: string | undefined): boolean {
  if (!lastHeartbeat) return true;
  const elapsed = Date.now() - new Date(lastHeartbeat).getTime();
  return elapsed > HEARTBEAT_TIMEOUT_MS;
}

export function AgentProvider({ children }: AgentProviderProps) {
  const [status, setStatusState] = useState<AgentStatus>('idle');
  const [connected, setConnected] = useState<boolean>(false);
  const [modelList, setModelList] = useState<string[]>(['default']);
  const [currentModel, setCurrentModelState] = useState<string>('default');
  const [lastHeartbeat, setLastHeartbeat] = useState<string | undefined>(undefined);
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>('idle');
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive display status from heartbeat freshness + gateway connectivity
  const updateDisplayStatus = useCallback((agentStatus: AgentStatus, heartbeat: string | undefined, gatewayConnected: boolean) => {
    if (isHeartbeatStale(heartbeat)) {
      // Heartbeat stale, but if gateway is reachable the system is still operational
      setDisplayStatus(gatewayConnected ? agentStatus : 'disconnected');
    } else {
      setDisplayStatus(agentStatus);
    }
  }, []);

  // Apply agent state from Supabase (used by both initial fetch and Realtime)
  const applyAgentState = useCallback((state: AgentState) => {
    console.log(`[DIAG][AgentContext] applyAgentState: status=${state.status}, model=${state.currentModel}, modelList=[${state.modelList.join(',')}], heartbeat=${state.lastHeartbeat}`);
    setStatusState(state.status);
    setCurrentModelState(state.currentModel);
    if (state.modelList.length > 0) {
      setModelList(state.modelList);
    }
    setLastHeartbeat(state.lastHeartbeat);
    updateDisplayStatus(state.status, state.lastHeartbeat, connected);
  }, [updateDisplayStatus, connected]);

  const setStatus = useCallback((newStatus: AgentStatus) => {
    setStatusState(newStatus);
  }, []);

  // Gateway connectivity check — supplementary signal
  const refresh = useCallback(async () => {
    try {
      const [modelsRes, statusRes] = await Promise.all([fetchModels(), fetchStatus()]);
      const isConnected = Boolean(statusRes?.connected);
      console.log(`[DIAG][AgentContext] refresh: connected=${isConnected}, modelsSource=${modelsRes?.source}, models=[${(modelsRes?.models || []).map(m => m.id).join(',')}], statusOk=${statusRes?.ok}`);
      setConnected(isConnected);

      const ids = (modelsRes?.models || []).map((m) => m.id).filter(Boolean);
      if (ids.length) {
        setModelList(ids);
        setCurrentModelState((prev) => (ids.includes(prev) ? prev : ids[0]));
      }

      // Re-evaluate display status with fresh connectivity info
      updateDisplayStatus(status, lastHeartbeat, isConnected);
    } catch (err) {
      console.error(`[DIAG][AgentContext] refresh FAILED:`, err);
      setConnected(false);
      updateDisplayStatus(status, lastHeartbeat, false);
    }
  }, [status, lastHeartbeat, updateDisplayStatus]);

  // On mount: fetch initial agent state from Supabase + subscribe to Realtime
  useEffect(() => {
    // Initial fetch
    void fetchAgentState().then((state) => {
      if (state) applyAgentState(state);
    });

    // Subscribe to Realtime changes
    const channel = subscribeAgentState((state) => {
      applyAgentState(state);
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [applyAgentState]);

  // Periodic heartbeat staleness check (re-evaluate every 10s)
  useEffect(() => {
    heartbeatTimerRef.current = setInterval(() => {
      updateDisplayStatus(status, lastHeartbeat, connected);
    }, 10_000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [status, lastHeartbeat, connected, updateDisplayStatus]);

  // Gateway connectivity polling (supplementary, less frequent)
  useEffect(() => {
    const initial = setTimeout(() => {
      void refresh();
    }, 0);

    const t = setInterval(() => {
      void refresh();
    }, 30_000);

    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, [refresh]);

  const setCurrentModel = useCallback(
    async (model: string) => {
      console.log(`[DIAG][AgentContext] setCurrentModel called: model=${model}`);
      setCurrentModelState(model);
      try {
        const result = await requestModelSwitch(model);
        console.log(`[DIAG][AgentContext] requestModelSwitch result:`, result);
      } catch (err) {
        console.error(`[DIAG][AgentContext] requestModelSwitch FAILED:`, err);
        throw err;
      }
      // On success, Supabase agent_state is updated server-side.
      // Realtime subscription will propagate the change to all clients.
    },
    []
  );

  const value: AgentContextValue = {
    status,
    displayStatus,
    connected,
    currentModel,
    modelList,
    lastHeartbeat,
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
