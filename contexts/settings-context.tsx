'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { TaskPriority, KanbanColumn } from '@/types';

// --- Types ---

export interface LabelConfig {
  id: string;
  name: string;
  color: string;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface BoardDefaults {
  defaultColumn: KanbanColumn;
  defaultPriority: TaskPriority;
}

export interface ChatSettings {
  displayName: string;
}

export interface AppSettings {
  labels: LabelConfig[];
  teamMembers: TeamMember[];
  board: BoardDefaults;
  chat: ChatSettings;
}

// --- Defaults ---

const DEFAULT_LABELS: LabelConfig[] = [
  { id: 'bug', name: 'bug', color: '#ef4444' },
  { id: 'feature', name: 'feature', color: '#3b82f6' },
  { id: 'enhancement', name: 'enhancement', color: '#a855f7' },
  { id: 'docs', name: 'docs', color: '#22c55e' },
  { id: 'design', name: 'design', color: '#ec4899' },
  { id: 'research', name: 'research', color: '#f59e0b' },
];

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'gideon', name: 'Gideon', initials: 'GD', color: '#6366f1' },
  { id: 'steve', name: 'Steve', initials: 'SS', color: '#0ea5e9' },
];

const DEFAULT_BOARD: BoardDefaults = {
  defaultColumn: 'backlog',
  defaultPriority: 'medium',
};

const DEFAULT_CHAT: ChatSettings = {
  displayName: 'You',
};

const DEFAULT_SETTINGS: AppSettings = {
  labels: DEFAULT_LABELS,
  teamMembers: DEFAULT_TEAM_MEMBERS,
  board: DEFAULT_BOARD,
  chat: DEFAULT_CHAT,
};

const STORAGE_KEY = 'mission-control-settings';

// --- Context ---

interface SettingsContextValue {
  settings: AppSettings;
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  // Labels
  addLabel: (name: string, color: string) => void;
  updateLabel: (id: string, updates: Partial<Omit<LabelConfig, 'id'>>) => void;
  deleteLabel: (id: string) => void;
  // Team Members
  addTeamMember: (name: string, initials: string, color: string) => void;
  updateTeamMember: (id: string, updates: Partial<Omit<TeamMember, 'id'>>) => void;
  deleteTeamMember: (id: string) => void;
  // Board
  updateBoardDefaults: (updates: Partial<BoardDefaults>) => void;
  // Chat
  updateChatSettings: (updates: Partial<ChatSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      return {
        labels: parsed.labels ?? DEFAULT_SETTINGS.labels,
        teamMembers: parsed.teamMembers ?? DEFAULT_SETTINGS.teamMembers,
        board: { ...DEFAULT_SETTINGS.board, ...parsed.board },
        chat: { ...DEFAULT_SETTINGS.chat, ...parsed.chat },
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  const persist = useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const openSettings = useCallback(() => setIsOpen(true), []);
  const closeSettings = useCallback(() => setIsOpen(false), []);

  // --- Labels ---
  const addLabel = useCallback((name: string, color: string) => {
    setSettings(prev => {
      const next = { ...prev, labels: [...prev.labels, { id: generateId(), name: name.toLowerCase(), color }] };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateLabel = useCallback((id: string, updates: Partial<Omit<LabelConfig, 'id'>>) => {
    setSettings(prev => {
      const next = { ...prev, labels: prev.labels.map(l => l.id === id ? { ...l, ...updates } : l) };
      saveSettings(next);
      return next;
    });
  }, []);

  const deleteLabel = useCallback((id: string) => {
    setSettings(prev => {
      const next = { ...prev, labels: prev.labels.filter(l => l.id !== id) };
      saveSettings(next);
      return next;
    });
  }, []);

  // --- Team Members ---
  const addTeamMember = useCallback((name: string, initials: string, color: string) => {
    setSettings(prev => {
      const next = { ...prev, teamMembers: [...prev.teamMembers, { id: generateId(), name, initials: initials.toUpperCase(), color }] };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateTeamMember = useCallback((id: string, updates: Partial<Omit<TeamMember, 'id'>>) => {
    setSettings(prev => {
      const next = { ...prev, teamMembers: prev.teamMembers.map(m => m.id === id ? { ...m, ...updates } : m) };
      saveSettings(next);
      return next;
    });
  }, []);

  const deleteTeamMember = useCallback((id: string) => {
    setSettings(prev => {
      const next = { ...prev, teamMembers: prev.teamMembers.filter(m => m.id !== id) };
      saveSettings(next);
      return next;
    });
  }, []);

  // --- Board ---
  const updateBoardDefaults = useCallback((updates: Partial<BoardDefaults>) => {
    setSettings(prev => {
      const next = { ...prev, board: { ...prev.board, ...updates } };
      saveSettings(next);
      return next;
    });
  }, []);

  // --- Chat ---
  const updateChatSettings = useCallback((updates: Partial<ChatSettings>) => {
    setSettings(prev => {
      const next = { ...prev, chat: { ...prev.chat, ...updates } };
      saveSettings(next);
      return next;
    });
  }, []);

  // Use defaults until mounted to avoid hydration mismatch
  const value: SettingsContextValue = {
    settings: mounted ? settings : DEFAULT_SETTINGS,
    isOpen,
    openSettings,
    closeSettings,
    addLabel,
    updateLabel,
    deleteLabel,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    updateBoardDefaults,
    updateChatSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
