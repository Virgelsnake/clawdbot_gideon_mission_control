'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type MobileTab = 'board' | 'ideas' | 'chat' | 'settings';

interface MobileViewContextValue {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  isMobile: boolean;
}

const MobileViewContext = createContext<MobileViewContextValue | undefined>(undefined);

const MOBILE_BREAKPOINT = 640; // sm breakpoint

export function MobileViewProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<MobileTab>('board');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const setActiveTab = useCallback((tab: MobileTab) => {
    setActiveTabState(tab);
  }, []);

  return (
    <MobileViewContext.Provider value={{ activeTab, setActiveTab, isMobile }}>
      {children}
    </MobileViewContext.Provider>
  );
}

export function useMobileView() {
  const context = useContext(MobileViewContext);
  if (context === undefined) {
    throw new Error('useMobileView must be used within a MobileViewProvider');
  }
  return context;
}
