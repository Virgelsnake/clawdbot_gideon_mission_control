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
    autonomy: {
      autoPickupEnabled: row.auto_pickup_enabled ?? true,
      maxConcurrentTasks: row.max_concurrent_tasks ?? 1,
      nightlyStartHour: row.nightly_start_hour ?? 22,
      repickWindowMinutes: row.repick_window_minutes ?? 120,
      dueDateUrgencyHours: row.due_date_urgency_hours ?? 48,
    },
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

// --- Second Brain mappers ---

import type {
  ConversationCard,
  CardTag,
  ConversationSegment,
  TagDefinition,
  RelatedCard,
  AutoGenerationRule,
  CardGenerationQueue,
  DbConversationCard,
  DbCardTag,
  DbConversationSegment,
  DbTagDefinition,
  DbRelatedCard,
  DbAutoGenerationRule,
  DbCardGenerationQueue,
} from '@/types';

export function dbCardToCard(row: DbConversationCard): ConversationCard {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    sourceType: row.source_type,
    sourceId: row.source_id ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    sessionId: row.session_id,
    userId: row.user_id,
    importance: row.importance,
    status: row.status,
    conversationDate: new Date(row.conversation_date).getTime(),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : undefined,
  };
}

export function cardToDbCard(
  card: Partial<ConversationCard> & { id?: string }
): Partial<DbConversationCard> {
  const row: Partial<DbConversationCard> = {};
  if (card.id !== undefined) row.id = card.id;
  if (card.title !== undefined) row.title = card.title;
  if (card.summary !== undefined) row.summary = card.summary;
  if (card.content !== undefined) row.content = card.content;
  if (card.sourceType !== undefined) row.source_type = card.sourceType;
  if (card.sourceId !== undefined) row.source_id = card.sourceId ?? null;
  if (card.sourceUrl !== undefined) row.source_url = card.sourceUrl ?? null;
  if (card.sessionId !== undefined) row.session_id = card.sessionId;
  if (card.userId !== undefined) row.user_id = card.userId;
  if (card.importance !== undefined) row.importance = card.importance;
  if (card.status !== undefined) row.status = card.status;
  if (card.conversationDate !== undefined) row.conversation_date = new Date(card.conversationDate).toISOString();
  if (card.archivedAt !== undefined) row.archived_at = card.archivedAt ? new Date(card.archivedAt).toISOString() : null;
  return row;
}

export function dbCardTagToCardTag(row: DbCardTag): CardTag {
  return {
    id: row.id,
    cardId: row.card_id,
    tag: row.tag,
    confidence: row.confidence,
    extractedBy: row.extracted_by,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function dbSegmentToSegment(row: DbConversationSegment): ConversationSegment {
  return {
    id: row.id,
    cardId: row.card_id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.timestamp).getTime(),
    sequenceOrder: row.sequence_order,
    metadata: row.metadata ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function segmentToDbSegment(
  segment: Partial<ConversationSegment> & { id?: string }
): Partial<DbConversationSegment> {
  const row: Partial<DbConversationSegment> = {};
  if (segment.id !== undefined) row.id = segment.id;
  if (segment.cardId !== undefined) row.card_id = segment.cardId;
  if (segment.role !== undefined) row.role = segment.role;
  if (segment.content !== undefined) row.content = segment.content;
  if (segment.timestamp !== undefined) row.timestamp = new Date(segment.timestamp).toISOString();
  if (segment.sequenceOrder !== undefined) row.sequence_order = segment.sequenceOrder;
  if (segment.metadata !== undefined) row.metadata = segment.metadata ?? null;
  return row;
}

export function dbTagDefinitionToTagDefinition(row: DbTagDefinition): TagDefinition {
  return {
    id: row.id,
    tag: row.tag,
    description: row.description ?? undefined,
    color: row.color,
    category: row.category,
    autoExtractPattern: row.auto_extract_pattern ?? undefined,
    usageCount: row.usage_count,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function dbRelatedCardToRelatedCard(row: DbRelatedCard): RelatedCard {
  return {
    id: row.id,
    sourceCardId: row.source_card_id,
    targetCardId: row.target_card_id,
    relationshipType: row.relationship_type,
    confidence: row.confidence,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function dbAutoRuleToAutoRule(row: DbAutoGenerationRule): AutoGenerationRule {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    sourceType: row.source_type,
    minMessageCount: row.min_message_count,
    minContentLength: row.min_content_length,
    autoSummarize: row.auto_summarize,
    autoExtractTags: row.auto_extract_tags,
    importanceBoost: row.importance_boost,
    excludePatterns: row.exclude_patterns ?? undefined,
    requirePatterns: row.require_patterns ?? undefined,
    enabled: row.enabled,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function dbQueueItemToQueueItem(row: DbCardGenerationQueue): CardGenerationQueue {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sessionId: row.session_id,
    rawData: row.raw_data,
    status: row.status,
    priority: row.priority,
    cardId: row.card_id ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    processingStartedAt: row.processing_started_at ? new Date(row.processing_started_at).getTime() : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
  };
}
