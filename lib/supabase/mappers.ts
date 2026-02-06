import type {
  Task,
  Idea,
  AgentState,
  Message,
  DbTask,
  DbIdea,
  DbAgentState,
  DbMessage,
} from '@/types';

// --- Task mappers ---

export function dbTaskToTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    column: row.column_status,
    priority: row.priority ?? undefined,
    assignee: row.assignee ?? undefined,
    dueDate: row.due_date ? new Date(row.due_date).getTime() : undefined,
    labels: row.labels ?? [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function taskToDbTask(
  task: Partial<Task> & { id?: string }
): Partial<DbTask> {
  const row: Partial<DbTask> = {};
  if (task.id !== undefined) row.id = task.id;
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description ?? null;
  if (task.column !== undefined) row.column_status = task.column;
  if (task.priority !== undefined) row.priority = task.priority ?? null;
  if (task.assignee !== undefined) row.assignee = task.assignee ?? null;
  if (task.dueDate !== undefined)
    row.due_date = task.dueDate ? new Date(task.dueDate).toISOString() : null;
  if (task.labels !== undefined) row.labels = task.labels ?? [];
  return row;
}

// --- Idea mappers ---

export function dbIdeaToIdea(row: DbIdea): Idea {
  return {
    id: row.id,
    content: row.content,
    createdAt: new Date(row.created_at).getTime(),
    archived: row.archived,
    convertedToTaskId: row.converted_to_task_id ?? undefined,
    archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : undefined,
  };
}

export function ideaToDbIdea(
  idea: Partial<Idea> & { id?: string }
): Partial<DbIdea> {
  const row: Partial<DbIdea> = {};
  if (idea.id !== undefined) row.id = idea.id;
  if (idea.content !== undefined) row.content = idea.content;
  if (idea.archived !== undefined) row.archived = idea.archived;
  if (idea.convertedToTaskId !== undefined)
    row.converted_to_task_id = idea.convertedToTaskId ?? null;
  if (idea.archivedAt !== undefined)
    row.archived_at = idea.archivedAt ? new Date(idea.archivedAt).toISOString() : null;
  return row;
}

// --- AgentState mappers ---

export function dbAgentStateToAgentState(row: DbAgentState): AgentState {
  return {
    status: row.status,
    currentModel: row.current_model,
    modelList: row.model_list ?? [],
    lastHeartbeat: row.last_heartbeat ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

// --- Message mappers ---

export function dbMessageToMessage(row: DbMessage): Message {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.created_at).getTime(),
    session_id: row.session_id,
  };
}

export function messageToDbMessage(
  msg: Partial<Message>
): Partial<DbMessage> {
  const row: Partial<DbMessage> = {};
  if (msg.role !== undefined) row.role = msg.role;
  if (msg.content !== undefined) row.content = msg.content;
  if (msg.session_id !== undefined) row.session_id = msg.session_id;
  return row;
}
