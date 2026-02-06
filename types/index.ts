// Agent types
export type AgentStatus = 'idle' | 'thinking' | 'active' | 'resting';

export interface AgentState {
  status: AgentStatus;
  currentModel: string;
  modelList: string[];
  lastHeartbeat?: string;
  updatedAt?: string;
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
}

export interface DbMessage {
  id: string;
  role: MessageRole;
  content: string;
  session_id: string;
  created_at: string;
}
