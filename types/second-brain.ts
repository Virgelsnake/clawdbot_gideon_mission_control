export interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source_type: 'chat' | 'voice' | 'email' | 'document' | 'web' | 'manual';
  source_id?: string;
  source_url?: string;
  session_id?: string;
  user_id?: string;
  importance: number;
  status: 'active' | 'archived' | 'processing';
  conversation_date: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  tags?: string[];
  message_count?: number;
  task_count?: number;
}

export interface CreateConversationCardInput {
  title: string;
  summary: string;
  content?: string;
  source_type: 'chat' | 'voice' | 'email' | 'document' | 'web' | 'manual';
  source_id?: string;
  source_url?: string;
  importance?: number;
  tags?: string[];
}

export interface UpdateConversationCardInput {
  title?: string;
  summary?: string;
  content?: string;
  importance?: number;
  status?: 'active' | 'archived' | 'processing';
  tags?: string[];
}

export interface CardFilterOptions {
  source?: string;
  dateRange?: string;
  importance?: string;
  searchQuery?: string;
}
