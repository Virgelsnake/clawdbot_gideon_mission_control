import { supabase } from './client';
import { dbMessageToMessage } from './mappers';
import type { Message, MessageRole, DbMessage } from '@/types';

const DEFAULT_SESSION_ID = 'default';

export async function fetchMessages(options?: {
  limit?: number;
  before?: string; // ISO timestamp — fetch messages older than this
  sessionId?: string;
}): Promise<Message[]> {
  const limit = options?.limit ?? 50;
  const sessionId = options?.sessionId ?? DEFAULT_SESSION_ID;

  let query = supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options?.before) {
    query = query.lt('created_at', options.before);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Reverse so oldest is first (display order)
  return (data as DbMessage[]).reverse().map(dbMessageToMessage);
}

export async function createMessage(
  role: MessageRole,
  content: string,
  sessionId?: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      role,
      content,
      session_id: sessionId ?? DEFAULT_SESSION_ID,
    })
    .select()
    .single();

  if (error) throw error;
  return dbMessageToMessage(data as DbMessage);
}

export async function deleteAllMessages(sessionId?: string): Promise<void> {
  const sid = sessionId ?? DEFAULT_SESSION_ID;
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('session_id', sid);

  if (error) throw error;
}
