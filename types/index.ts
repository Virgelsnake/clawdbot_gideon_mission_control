// Agent types
export type AgentStatus = 'idle' | 'thinking' | 'active' | 'resting';

export interface AutonomyConfig {
  autoPickupEnabled: boolean;
  maxConcurrentTasks: number;
  nightlyStartHour: number;
  repickWindowMinutes: number;
  dueDateUrgencyHours: number;
}

export interface AgentState {
  status: AgentStatus;
  currentModel: string;
  modelList: string[];
  lastHeartbeat?: string;
  updatedAt?: string;
  autonomy: AutonomyConfig;
}

// Chat types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  session_id?: string;
}

// Task/Kanban types
export type KanbanColumn = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DueDateFilter = 'overdue' | 'today' | 'this-week' | 'no-date' | null;

export interface TaskFilters {
  search: string;
  priorities: TaskPriority[];
  assignee: string;
  labels: string[];
  dueDateFilter: DueDateFilter;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}
export interface Task {
  id: string;
  title: string;
  description?: string;
  column: KanbanColumn;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: number;
  labels?: string[];
  createdAt: number;
  updatedAt: number;
}

// Ideas types
export interface Idea {
  id: string;
  content: string;
  createdAt: number;
  archived?: boolean;
  convertedToTaskId?: string;
  archivedAt?: number;
}

// Supabase DB row types (snake_case, matching table columns)
export interface DbTask {
  id: string;
  title: string;
  description: string | null;
  column_status: KanbanColumn;
  priority: TaskPriority | null;
  assignee: string | null;
  due_date: string | null;
  labels: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbIdea {
  id: string;
  content: string;
  archived: boolean;
  converted_to_task_id: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface DbAgentState {
  id: string;
  agent_id: string;
  status: AgentStatus;
  current_model: string;
  model_list: string[];
  last_heartbeat: string | null;
  updated_at: string | null;
  auto_pickup_enabled: boolean;
  max_concurrent_tasks: number;
  nightly_start_hour: number;
  repick_window_minutes: number;
  due_date_urgency_hours: number;
}

export interface DbMessage {
  id: string;
  role: MessageRole;
  content: string;
  session_id: string;
  created_at: string;
}

// Activity Log types
export type ActivityLogAction =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'status_changed'
  | 'task_assigned'
  | 'task_completed'
  | 'idea_created'
  | 'idea_archived'
  | 'idea_converted'
  | 'idea_deleted'
  | 'model_switched'
  | 'config_updated'
  | 'comment_added';

export type ActivityLogEntityType = 'task' | 'idea' | 'agent_state';

export interface ActivityLog {
  id: string;
  actor: string;
  action: ActivityLogAction;
  entityType: ActivityLogEntityType;
  entityId?: string;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface DbActivityLog {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, { old?: unknown; new?: unknown }> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Task Comment types
export interface TaskComment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface DbTaskComment {
  id: string;
  task_id: string;
  author: string;
  content: string;
  created_at: string;
}

// ============================================
// Second Brain Types
// ============================================

export type CardSourceType = 'chat' | 'voice' | 'email' | 'document' | 'web' | 'manual';
export type CardStatus = 'active' | 'archived' | 'processing';
export type SegmentRole = 'user' | 'assistant' | 'system';
export type RelationshipType = 'related' | 'child' | 'parent' | 'reference' | 'duplicate';
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ConversationCard {
  id: string;
  title: string;
  summary: string;
  content: string;
  sourceType: CardSourceType;
  sourceId?: string;
  sourceUrl?: string;
  sessionId: string;
  userId: string;
  importance: number;
  status: CardStatus;
  conversationDate: number;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
  tags?: CardTag[]; // Joined from card_tags
  segments?: ConversationSegment[]; // Joined from conversation_segments
}

export interface CardTag {
  id: string;
  cardId: string;
  tag: string;
  confidence: number;
  extractedBy: 'auto' | 'manual' | 'ai';
  createdAt: number;
}

export interface ConversationSegment {
  id: string;
  cardId: string;
  role: SegmentRole;
  content: string;
  timestamp: number;
  sequenceOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface TagDefinition {
  id: string;
  tag: string;
  description?: string;
  color: string;
  category: string;
  autoExtractPattern?: string;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface RelatedCard {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  relationshipType: RelationshipType;
  confidence: number;
  createdAt: number;
  targetCard?: ConversationCard; // Joined
}

export interface AutoGenerationRule {
  id: string;
  name: string;
  description?: string;
  sourceType: CardSourceType | 'any';
  minMessageCount: number;
  minContentLength: number;
  autoSummarize: boolean;
  autoExtractTags: boolean;
  importanceBoost: number;
  excludePatterns?: string[];
  requirePatterns?: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CardGenerationQueue {
  id: string;
  sourceType: CardSourceType;
  sourceId: string;
  sessionId: string;
  rawData: Record<string, unknown>;
  status: QueueStatus;
  priority: number;
  cardId?: string;
  errorMessage?: string;
  createdAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
}

// Filter types for queries
export interface CardFilters {
  search?: string;
  tags?: string[];
  sourceType?: CardSourceType;
  status?: CardStatus;
  importanceMin?: number;
  importanceMax?: number;
  dateFrom?: number;
  dateTo?: number;
}

// Supabase DB row types (snake_case)
export interface DbConversationCard {
  id: string;
  title: string;
  summary: string;
  content: string;
  source_type: CardSourceType;
  source_id: string | null;
  source_url: string | null;
  session_id: string;
  user_id: string;
  importance: number;
  status: CardStatus;
  conversation_date: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  search_vector: unknown; // tsvector
}

export interface DbCardTag {
  id: string;
  card_id: string;
  tag: string;
  confidence: number;
  extracted_by: 'auto' | 'manual' | 'ai';
  created_at: string;
}

export interface DbConversationSegment {
  id: string;
  card_id: string;
  role: SegmentRole;
  content: string;
  timestamp: string;
  sequence_order: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DbTagDefinition {
  id: string;
  tag: string;
  description: string | null;
  color: string;
  category: string;
  auto_extract_pattern: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbRelatedCard {
  id: string;
  source_card_id: string;
  target_card_id: string;
  relationship_type: RelationshipType;
  confidence: number;
  created_at: string;
}

export interface DbAutoGenerationRule {
  id: string;
  name: string;
  description: string | null;
  source_type: CardSourceType | 'any';
  min_message_count: number;
  min_content_length: number;
  auto_summarize: boolean;
  auto_extract_tags: boolean;
  importance_boost: number;
  exclude_patterns: string[] | null;
  require_patterns: string[] | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCardGenerationQueue {
  id: string;
  source_type: CardSourceType;
  source_id: string;
  session_id: string;
  raw_data: Record<string, unknown>;
  status: QueueStatus;
  priority: number;
  card_id: string | null;
  error_message: string | null;
  created_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  max_retries: number;
}

// Re-export calendar types
export * from './calendar';
