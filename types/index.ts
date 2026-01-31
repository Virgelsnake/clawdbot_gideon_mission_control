// Agent types
export type AgentStatus = 'idle' | 'thinking' | 'active' | 'resting';

export interface AgentState {
  status: AgentStatus;
  currentModel: string;
  modelList: string[];
}

// Chat types
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
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
