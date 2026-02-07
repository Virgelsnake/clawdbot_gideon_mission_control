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
