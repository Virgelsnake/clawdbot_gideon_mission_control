import { supabase } from './client';
import { logActivity } from './activity-log';
import type { TaskComment, DbTaskComment } from '@/types';

// --- Mappers ---

export function dbTaskCommentToTaskComment(row: DbTaskComment): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    author: row.author,
    content: row.content,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// --- Data operations ---

export async function fetchComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[task-comments] Failed to fetch comments:', error.message);
    return [];
  }
  return (data as DbTaskComment[]).map(dbTaskCommentToTaskComment);
}

export async function createComment(
  taskId: string,
  author: string,
  content: string
): Promise<TaskComment | null> {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      author,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('[task-comments] Failed to create comment:', error.message);
    return null;
  }

  const comment = dbTaskCommentToTaskComment(data as DbTaskComment);

  logActivity({
    actor: author,
    action: 'comment_added',
    entityType: 'task',
    entityId: taskId,
    metadata: { content: content.slice(0, 200) },
  });

  return comment;
}

export function subscribeTaskComments(
  taskId: string,
  onChange: (comment: TaskComment) => void
): () => void {
  const channel = supabase
    .channel(`task_comments_${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'task_comments',
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        const row = payload.new as DbTaskComment;
        onChange(dbTaskCommentToTaskComment(row));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
