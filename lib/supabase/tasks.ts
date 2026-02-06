import { supabase } from './client';
import { dbTaskToTask, taskToDbTask } from './mappers';
import type { Task, KanbanColumn, DbTask } from '@/types';

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as DbTask[]).map(dbTaskToTask);
}

export async function createTask(task: {
  title: string;
  description?: string;
  column?: KanbanColumn;
  priority?: Task['priority'];
  assignee?: string;
  dueDate?: number;
  labels?: string[];
  createdBy?: string;
}): Promise<Task> {
  const row: Record<string, unknown> = {
    title: task.title,
    column_status: task.column ?? 'backlog',
  };
  if (task.description !== undefined) row.description = task.description;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.assignee !== undefined) row.assignee = task.assignee;
  if (task.dueDate !== undefined) row.due_date = new Date(task.dueDate).toISOString();
  if (task.labels !== undefined) row.labels = task.labels;
  if (task.createdBy !== undefined) row.created_by = task.createdBy;

  const { data, error } = await supabase
    .from('tasks')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return dbTaskToTask(data as DbTask);
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<Task> {
  const dbUpdates = taskToDbTask(updates);
  (dbUpdates as Record<string, unknown>).updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return dbTaskToTask(data as DbTask);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
