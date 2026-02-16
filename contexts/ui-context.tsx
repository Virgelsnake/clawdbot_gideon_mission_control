'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UIContextValue {
  // Task detail dialog state
  isTaskDetailOpen: boolean;
  setTaskDetailOpen: (open: boolean) => void;
  // Second Brain card detail state
  isCardDetailOpen: boolean;
  setCardDetailOpen: (open: boolean) => void;
  // Chat panel collapse state (controlled by detail panels)
  wasChatPanelOpenBeforeTask: boolean;
  setWasChatPanelOpenBeforeTask: (wasOpen: boolean) => void;
  // Helper to check if any detail panel is open
  isAnyDetailOpen: boolean;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isCardDetailOpen, setIsCardDetailOpen] = useState(false);
  const [wasChatPanelOpenBeforeTask, setWasChatPanelOpenBeforeTask] = useState(true);

  const handleSetTaskDetailOpen = useCallback((open: boolean) => {
    setIsTaskDetailOpen(open);
  }, []);

  const handleSetCardDetailOpen = useCallback((open: boolean) => {
    setIsCardDetailOpen(open);
  }, []);

  const isAnyDetailOpen = isTaskDetailOpen || isCardDetailOpen;

  const value: UIContextValue = {
    isTaskDetailOpen,
    setTaskDetailOpen: handleSetTaskDetailOpen,
    isCardDetailOpen,
    setCardDetailOpen: handleSetCardDetailOpen,
    wasChatPanelOpenBeforeTask,
    setWasChatPanelOpenBeforeTask,
    isAnyDetailOpen,
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
