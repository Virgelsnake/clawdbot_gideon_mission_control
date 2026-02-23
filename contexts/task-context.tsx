'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { Task, KanbanColumn, Idea, TaskFilters, DbTask, DbIdea } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { dbTaskToTask } from '@/lib/supabase/mappers';
import { dbIdeaToIdea } from '@/lib/supabase/mappers';
import {
  fetchTasks as sbFetchTasks,
  createTask as sbCreateTask,
  updateTask as sbUpdateTask,
  deleteTask as sbDeleteTask,
} from '@/lib/supabase/tasks';
import {
  fetchIdeas as sbFetchIdeas,
  createIdea as sbCreateIdea,
  updateIdea as sbUpdateIdea,
  deleteIdea as sbDeleteIdea,
} from '@/lib/supabase/ideas';
import { migrateLocalStorageToSupabase } from '@/lib/supabase/migrate-localstorage';
import { hasTaskContextDoc } from '@/lib/task-context-doc-client';
import { getTaskWorkflowMeta } from '@/lib/task-workflow-meta';
import { toast } from 'sonner';

interface TaskContextValue {
  tasks: Task[];
  filteredTasks: Task[];
  ideas: Idea[];
  loading: boolean;
  addTask: (title: string, description?: string, column?: KanbanColumn, priority?: Task['priority'], assignee?: string, dueDate?: number, labels?: string[]) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, toColumn: KanbanColumn) => Promise<void>;
  addIdea: (content: string) => void;
  deleteIdea: (id: string) => void;
  archiveIdea: (id: string, taskId: string) => Promise<void>;
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

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

  // Load tasks and ideas from Supabase on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    async function loadData() {
      try {
        // One-time migration: move any localStorage data to Supabase
        await migrateLocalStorageToSupabase();

        const [tasksData, ideasData] = await Promise.all([
          sbFetchTasks(),
          sbFetchIdeas(),
        ]);
        setTasks(tasksData);
        setAllIdeas(ideasData);
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Supabase Realtime subscription for tasks
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = dbTaskToTask(payload.new as DbTask);
            setTasks((prev) => {
              if (prev.some((t) => t.id === newTask.id)) return prev;
              return [...prev, newTask];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbTaskToTask(payload.new as DbTask);
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Supabase Realtime subscription for ideas
  useEffect(() => {
    const channel = supabase
      .channel('ideas-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newIdea = dbIdeaToIdea(payload.new as DbIdea);
            setAllIdeas((prev) => {
              if (prev.some((i) => i.id === newIdea.id)) return prev;
              return [...prev, newIdea];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbIdeaToIdea(payload.new as DbIdea);
            setAllIdeas((prev) =>
              prev.map((i) => (i.id === updated.id ? updated : i))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setAllIdeas((prev) => prev.filter((i) => i.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const addTask = useCallback(async (title: string, description?: string, column: KanbanColumn = 'backlog', priority?: Task['priority'], assignee?: string, dueDate?: number, labels?: string[]) => {
    try {
      return await sbCreateTask({ title, description, column, priority, assignee, dueDate, labels });
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    try {
      if (updates.column === 'in-progress') {
        const hasDoc = await hasTaskContextDoc(id);
        if (!hasDoc) {
          toast.error('Cannot move to In Progress without task execution doc.');
          return;
        }
      }
      if (updates.column === 'review') {
        const meta = getTaskWorkflowMeta(id);
        if (!meta.evidenceLinks || meta.evidenceLinks.length === 0) {
          toast.error('Cannot move to Review without at least one evidence link.');
          return;
        }
      }
      await sbUpdateTask(id, updates);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await sbDeleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, []);

  const moveTask = useCallback(async (id: string, toColumn: KanbanColumn) => {
    try {
      if (toColumn === 'in-progress') {
        const hasDoc = await hasTaskContextDoc(id);
        if (!hasDoc) {
          toast.error('Cannot move to In Progress without task execution doc.');
          return;
        }
      }
      if (toColumn === 'review') {
        const meta = getTaskWorkflowMeta(id);
        if (!meta.evidenceLinks || meta.evidenceLinks.length === 0) {
          toast.error('Cannot move to Review without at least one evidence link.');
          return;
        }
      }
      await sbUpdateTask(id, { column: toColumn });
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  }, []);

  const addIdea = useCallback((content: string) => {
    sbCreateIdea(content.trim()).catch(
      (err) => console.error('Failed to create idea:', err)
    );
  }, []);

  const deleteIdea = useCallback((id: string) => {
    sbDeleteIdea(id).catch(
      (err) => console.error('Failed to delete idea:', err)
    );
  }, []);

  const archiveIdea = useCallback(async (id: string, taskId: string) => {
    try {
      await sbUpdateIdea(id, {
        archived: true,
        convertedToTaskId: taskId,
        archivedAt: Date.now(),
      });
    } catch (err) {
      console.error('Failed to archive idea:', err);
      throw err;
    }
  }, []);

  const promoteIdea = useCallback((id: string) => {
    const idea = allIdeas.find((i) => i.id === id);
    if (idea) {
      sbCreateTask({ title: idea.content, column: 'backlog' })
        .then((newTask) => {
          archiveIdea(id, newTask.id);
        })
        .catch((err) => console.error('Failed to promote idea:', err));
    }
  }, [allIdeas, archiveIdea]);

  const value: TaskContextValue = {
    tasks,
    filteredTasks,
    ideas,
    loading,
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
