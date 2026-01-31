'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Task, KanbanColumn, Idea } from '@/types';
import { loadTasks, saveTasks, loadIdeas, saveIdeas } from '@/lib/storage/tasks';

interface TaskContextValue {
  tasks: Task[];
  ideas: Idea[];
  addTask: (title: string, description?: string, column?: KanbanColumn, priority?: Task['priority'], assignee?: string, dueDate?: number, labels?: string[]) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, toColumn: KanbanColumn) => void;
  addIdea: (content: string) => void;
  deleteIdea: (id: string) => void;
  archiveIdea: (id: string, taskId: string) => void;
  promoteIdea: (id: string) => void;
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

  // Filter out archived ideas for display
  const ideas = allIdeas.filter(idea => !idea.archived);

  // Save to localStorage on every change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveIdeas(allIdeas);
  }, [allIdeas]);

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
    ideas,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addIdea,
    deleteIdea,
    archiveIdea,
    promoteIdea,
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
