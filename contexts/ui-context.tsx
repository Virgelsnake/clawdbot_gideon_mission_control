'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UIContextValue {
  // Task detail dialog state
  isTaskDetailOpen: boolean;
  setTaskDetailOpen: (open: boolean) => void;
  // Chat panel collapse state (controlled by task detail)
  wasChatPanelOpenBeforeTask: boolean;
  setWasChatPanelOpenBeforeTask: (wasOpen: boolean) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [wasChatPanelOpenBeforeTask, setWasChatPanelOpenBeforeTask] = useState(true);

  const handleSetTaskDetailOpen = useCallback((open: boolean) => {
    setIsTaskDetailOpen(open);
  }, []);

  const value: UIContextValue = {
    isTaskDetailOpen,
    setTaskDetailOpen: handleSetTaskDetailOpen,
    wasChatPanelOpenBeforeTask,
    setWasChatPanelOpenBeforeTask,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
