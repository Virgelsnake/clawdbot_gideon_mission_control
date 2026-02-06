import { supabase } from './client';
import type { Task, Idea } from '@/types';

const TASKS_STORAGE_KEY = 'gideon-tasks';
const IDEAS_STORAGE_KEY = 'gideon-ideas';
const MIGRATION_DONE_KEY = 'gideon-supabase-migration-done';

/**
 * One-time migration: reads tasks and ideas from localStorage,
 * inserts them into Supabase if the tables are empty, then clears
 * the localStorage keys. Skips silently if already migrated, if
 * localStorage is empty, or if Supabase tables already have data.
 */
export async function migrateLocalStorageToSupabase(): Promise<{
  migrated: boolean;
  taskCount: number;
  ideaCount: number;
}> {
  if (typeof window === 'undefined') {
    return { migrated: false, taskCount: 0, ideaCount: 0 };
  }

  // Already migrated in a previous session
  if (localStorage.getItem(MIGRATION_DONE_KEY)) {
    return { migrated: false, taskCount: 0, ideaCount: 0 };
  }

  // Read localStorage data
  const rawTasks = localStorage.getItem(TASKS_STORAGE_KEY);
  const rawIdeas = localStorage.getItem(IDEAS_STORAGE_KEY);

  if (!rawTasks && !rawIdeas) {
    // Nothing to migrate
    return { migrated: false, taskCount: 0, ideaCount: 0 };
  }

  let localTasks: Task[] = [];
  let localIdeas: Idea[] = [];

  try {
    if (rawTasks) localTasks = JSON.parse(rawTasks) as Task[];
  } catch {
    console.warn('migrate-localstorage: failed to parse tasks from localStorage');
  }

  try {
    if (rawIdeas) localIdeas = JSON.parse(rawIdeas) as Idea[];
  } catch {
    console.warn('migrate-localstorage: failed to parse ideas from localStorage');
  }

  if (localTasks.length === 0 && localIdeas.length === 0) {
    return { migrated: false, taskCount: 0, ideaCount: 0 };
  }

  // Check if Supabase tables already have data — only migrate into empty tables
  const [{ count: taskCount }, { count: ideaCount }] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('ideas').select('*', { count: 'exact', head: true }),
  ]);

  if ((taskCount ?? 0) > 0 || (ideaCount ?? 0) > 0) {
    // Supabase already has data — skip migration, mark done
    localStorage.setItem(MIGRATION_DONE_KEY, new Date().toISOString());
    return { migrated: false, taskCount: 0, ideaCount: 0 };
  }

  let migratedTasks = 0;
  let migratedIdeas = 0;

  // Migrate tasks
  if (localTasks.length > 0) {
    const rows = localTasks.map((t) => ({
      title: t.title,
      description: t.description ?? null,
      column_status: t.column ?? 'backlog',
      priority: t.priority ?? null,
      assignee: t.assignee ?? null,
      due_date: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      labels: t.labels ?? [],
      created_at: new Date(t.createdAt).toISOString(),
      updated_at: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date(t.createdAt).toISOString(),
    }));

    const { error } = await supabase.from('tasks').insert(rows);
    if (error) {
      console.error('migrate-localstorage: failed to insert tasks:', error);
      return { migrated: false, taskCount: 0, ideaCount: 0 };
    }
    migratedTasks = rows.length;
  }

  // Migrate ideas
  if (localIdeas.length > 0) {
    const rows = localIdeas.map((i) => ({
      content: i.content,
      archived: i.archived ?? false,
      converted_to_task_id: i.convertedToTaskId ?? null,
      archived_at: i.archivedAt ? new Date(i.archivedAt).toISOString() : null,
      created_at: new Date(i.createdAt).toISOString(),
    }));

    const { error } = await supabase.from('ideas').insert(rows);
    if (error) {
      console.error('migrate-localstorage: failed to insert ideas:', error);
      // Tasks already inserted — don't roll back, just log
    } else {
      migratedIdeas = rows.length;
    }
  }

  // Clear localStorage and mark migration done
  localStorage.removeItem(TASKS_STORAGE_KEY);
  localStorage.removeItem(IDEAS_STORAGE_KEY);
  localStorage.setItem(MIGRATION_DONE_KEY, new Date().toISOString());

  console.info(
    `migrate-localstorage: migrated ${migratedTasks} tasks and ${migratedIdeas} ideas to Supabase`
  );

  return { migrated: true, taskCount: migratedTasks, ideaCount: migratedIdeas };
}
