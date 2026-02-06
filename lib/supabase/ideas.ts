import { supabase } from './client';
import { dbIdeaToIdea } from './mappers';
import type { Idea, DbIdea } from '@/types';

export async function fetchIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as DbIdea[]).map(dbIdeaToIdea);
}

export async function createIdea(content: string): Promise<Idea> {
  const { data, error } = await supabase
    .from('ideas')
    .insert({ content })
    .select()
    .single();

  if (error) throw error;
  return dbIdeaToIdea(data as DbIdea);
}

export async function updateIdea(
  id: string,
  updates: Partial<Pick<Idea, 'content' | 'archived' | 'convertedToTaskId' | 'archivedAt'>>
): Promise<Idea> {
  const row: Record<string, unknown> = {};
  if (updates.content !== undefined) row.content = updates.content;
  if (updates.archived !== undefined) row.archived = updates.archived;
  if (updates.convertedToTaskId !== undefined)
    row.converted_to_task_id = updates.convertedToTaskId;
  if (updates.archivedAt !== undefined)
    row.archived_at = updates.archivedAt ? new Date(updates.archivedAt).toISOString() : null;

  const { data, error } = await supabase
    .from('ideas')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return dbIdeaToIdea(data as DbIdea);
}

export async function deleteIdea(id: string): Promise<void> {
  const { error } = await supabase.from('ideas').delete().eq('id', id);
  if (error) throw error;
}
