'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Task, KanbanColumn, Idea, TaskFilters, TaskPriority, DueDateFilter } from '@/types';
import { loadTasks, saveTasks, loadIdeas, saveIdeas } from '@/lib/storage/tasks';

interface TaskContextValue {
  tasks: Task[];
  filteredTasks: Task[];
  ideas: Idea[];
  addTask: (title: string, description?: string, column?: KanbanColumn, priority?: Task['priority'], assignee?: string, dueDate?: number, labels?: string[]) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, toColumn: KanbanColumn) => void;
  addIdea: (content: string) => void;
  deleteIdea: (id: string) => void;
  archiveIdea: (id: string, taskId: string) => void;
  promoteIdea: (id: string) => void;
  filters: TaskFilters;
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  clearFilters: () => void;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Lazy initialization from localStorage
    if (typeof window !== 'undefined') {
      const stored = loadTasks();
      return stored ?? [];
    }
    return [];
  });

  const [allIdeas, setAllIdeas] = useState<Idea[]>(() => {
    // Lazy initialization from localStorage
    if (typeof window !== 'undefined') {
      const stored = loadIdeas();
      return stored ?? [];
    }
    return [];
  });

  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    priorities: [],
    assignee: '',
    labels: [],
    dueDateFilter: null,
  });

  // Filter out archived ideas for display
  const ideas = allIdeas.filter(idea => !idea.archived);

  // Compute filtered tasks based on active filters
  const filteredTasks = tasks.filter(task => {
    // Search filter (title and description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDesc = task.description?.toLowerCase().includes(searchLower) ?? false;
      if (!matchesTitle && !matchesDesc) return false;
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      if (!task.priority || !filters.priorities.includes(task.priority)) return false;
    }

    // Assignee filter
    if (filters.assignee) {
      const assigneeLower = filters.assignee.toLowerCase();
      if (!task.assignee?.toLowerCase().includes(assigneeLower)) return false;
    }

    // Labels filter
    if (filters.labels.length > 0) {
      if (!task.labels || !filters.labels.some(label => task.labels?.includes(label))) return false;
    }

    // Due date filter
    if (filters.dueDateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      const weekMs = 7 * 24 * 60 * 60 * 1000;

      switch (filters.dueDateFilter) {
        case 'overdue':
          if (!task.dueDate || task.dueDate >= todayMs) return false;
          break;
        case 'today':
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          if (taskDate.getTime() !== todayMs) return false;
          break;
        case 'this-week':
          if (!task.dueDate || task.dueDate < todayMs || task.dueDate > todayMs + weekMs) return false;
          break;
        case 'no-date':
          if (task.dueDate) return false;
          break;
      }
    }

    return true;
  });

  // Save to localStorage on every change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveIdeas(allIdeas);
  }, [allIdeas]);

  const setFilter = useCallback(<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      priorities: [],
      assignee: '',
      labels: [],
      dueDateFilter: null,
    });
  }, []);

  const addTask = useCallback((title: string, description?: string, column: KanbanColumn = 'backlog', priority?: Task['priority'], assignee?: string, dueDate?: number, labels?: string[]) => {
    const now = Date.now();
    const newTask: Task = {
      id: `task-${now}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      column,
      priority,
      assignee,
      dueDate,
      labels,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: Date.now() }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const moveTask = useCallback((id: string, toColumn: KanbanColumn) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, column: toColumn, updatedAt: Date.now() }
          : task
      )
    );
  }, []);

  const addIdea = useCallback((content: string) => {
    const now = Date.now();
    const newIdea: Idea = {
      id: `idea-${now}-${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      createdAt: now,
    };
    setAllIdeas((prev) => [...prev, newIdea]);
  }, []);

  const deleteIdea = useCallback((id: string) => {
    setAllIdeas((prev) => prev.filter((idea) => idea.id !== id));
  }, []);

  const archiveIdea = useCallback((id: string, taskId: string) => {
    setAllIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id
          ? { ...idea, archived: true, convertedToTaskId: taskId, archivedAt: Date.now() }
          : idea
      )
    );
  }, []);

  const promoteIdea = useCallback((id: string) => {
    const idea = allIdeas.find((i) => i.id === id);
    if (idea) {
      // Add as task to backlog
      const now = Date.now();
      const newTask: Task = {
        id: `task-${now}-${Math.random().toString(36).substr(2, 9)}`,
        title: idea.content,
        column: 'backlog',
        createdAt: now,
        updatedAt: now,
      };
      setTasks((prev) => [...prev, newTask]);
      // Archive the idea
      archiveIdea(id, newTask.id);
    }
  }, [allIdeas, archiveIdea]);

  const value: TaskContextValue = {
    tasks,
    filteredTasks,
    ideas,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addIdea,
    deleteIdea,
    archiveIdea,
    promoteIdea,
    filters,
    setFilter,
    clearFilters,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}
