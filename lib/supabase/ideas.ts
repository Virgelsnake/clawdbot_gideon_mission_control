import { supabase } from './client';
import { dbIdeaToIdea } from './mappers';
import { logActivity } from './activity-log';
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
  const created = dbIdeaToIdea(data as DbIdea);
  logActivity({
    actor: 'steve',
    action: 'idea_created',
    entityType: 'idea',
    entityId: created.id,
    metadata: { content: created.content.substring(0, 100) },
  });
  return created;
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
  const updated = dbIdeaToIdea(data as DbIdea);

  let action: 'idea_archived' | 'idea_converted' = 'idea_archived';
  if (updates.convertedToTaskId) action = 'idea_converted';
  if (updates.archived || updates.convertedToTaskId) {
    logActivity({
      actor: 'steve',
      action,
      entityType: 'idea',
      entityId: id,
      metadata: {
        content: updated.content.substring(0, 100),
        ...(updates.convertedToTaskId ? { taskId: updates.convertedToTaskId } : {}),
      },
    });
  }
  return updated;
}

export async function deleteIdea(id: string): Promise<void> {
  const { data: existing } = await supabase
    .from('ideas')
    .select('content')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('ideas').delete().eq('id', id);
  if (error) throw error;

  logActivity({
    actor: 'steve',
    action: 'idea_deleted',
    entityType: 'idea',
    entityId: id,
    metadata: { content: existing?.content?.substring(0, 100) ?? 'Unknown' },
  });
}
