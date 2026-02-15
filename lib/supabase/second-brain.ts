import { supabase } from './client';
import { dbTagDefinitionToTagDefinition, dbQueueItemToQueueItem, dbRelatedCardToRelatedCard } from './mappers';
import type { 
  TagDefinition, 
  RelatedCard, 
  AutoGenerationRule, 
  CardGenerationQueue,
  DbTagDefinition,
  DbRelatedCard,
  DbAutoGenerationRule,
  DbCardGenerationQueue,
  CardSourceType,
} from '@/types';

// ============================================
// TAG DEFINITIONS
// ============================================

export async function fetchTagDefinitions(options?: {
  category?: string;
  limit?: number;
}): Promise<TagDefinition[]> {
  let query = supabase
    .from('tag_definitions')
    .select('*')
    .order('usage_count', { ascending: false });

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as DbTagDefinition[]).map(dbTagDefinitionToTagDefinition);
}

export async function fetchTagDefinition(tag: string): Promise<TagDefinition | null> {
  const { data, error } = await supabase
    .from('tag_definitions')
    .select('*')
    .eq('tag', tag.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return dbTagDefinitionToTagDefinition(data as DbTagDefinition);
}

export async function createTagDefinition(
  tag: string, 
  options?: Partial<Omit<TagDefinition, 'id' | 'tag' | 'usageCount' | 'createdAt' | 'updatedAt'>>
): Promise<TagDefinition> {
  const { data, error } = await supabase
    .from('tag_definitions')
    .insert({
      tag: tag.toLowerCase().trim(),
      description: options?.description ?? null,
      color: options?.color ?? '#3b82f6',
      category: options?.category ?? 'general',
      auto_extract_pattern: options?.autoExtractPattern ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return dbTagDefinitionToTagDefinition(data as DbTagDefinition);
}

export async function updateTagDefinition(
  tag: string, 
  updates: Partial<Omit<TagDefinition, 'id' | 'tag' | 'usageCount' | 'createdAt' | 'updatedAt'>>
): Promise<TagDefinition> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.autoExtractPattern !== undefined) dbUpdates.auto_extract_pattern = updates.autoExtractPattern ?? null;

  const { data, error } = await supabase
    .from('tag_definitions')
    .update(dbUpdates)
    .eq('tag', tag.toLowerCase().trim())
    .select()
    .single();

  if (error) throw error;
  return dbTagDefinitionToTagDefinition(data as DbTagDefinition);
}

export async function deleteTagDefinition(tag: string): Promise<void> {
  const { error } = await supabase
    .from('tag_definitions')
    .delete()
    .eq('tag', tag.toLowerCase().trim());

  if (error) throw error;
}

// ============================================
// RELATED CARDS
// ============================================

export async function fetchRelatedCards(cardId: string): Promise<RelatedCard[]> {
  const { data, error } = await supabase
    .from('related_cards')
    .select('*')
    .or(`source_card_id.eq.${cardId},target_card_id.eq.${cardId}`);

  if (error) throw error;
  return (data as DbRelatedCard[]).map(dbRelatedCardToRelatedCard);
}

export async function addRelatedCard(
  sourceCardId: string, 
  targetCardId: string, 
  relationshipType: RelatedCard['relationshipType'] = 'related',
  confidence: number = 1.0
): Promise<RelatedCard> {
  const { data, error } = await supabase
    .from('related_cards')
    .insert({
      source_card_id: sourceCardId,
      target_card_id: targetCardId,
      relationship_type: relationshipType,
      confidence,
    })
    .select()
    .single();

  if (error) throw error;
  return dbRelatedCardToRelatedCard(data as DbRelatedCard);
}

export async function removeRelatedCard(relationId: string): Promise<void> {
  const { error } = await supabase
    .from('related_cards')
    .delete()
    .eq('id', relationId);

  if (error) throw error;
}

// ============================================
// AUTO GENERATION RULES
// ============================================

export async function fetchAutoGenerationRules(options?: {
  enabledOnly?: boolean;
}): Promise<AutoGenerationRule[]> {
  let query = supabase
    .from('auto_generation_rules')
    .select('*')
    .order('created_at', { ascending: true });

  if (options?.enabledOnly) {
    query = query.eq('enabled', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as DbAutoGenerationRule[]).map(row => ({
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
  }));
}

export async function fetchAutoGenerationRule(id: string): Promise<AutoGenerationRule | null> {
  const { data, error } = await supabase
    .from('auto_generation_rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    sourceType: data.source_type,
    minMessageCount: data.min_message_count,
    minContentLength: data.min_content_length,
    autoSummarize: data.auto_summarize,
    autoExtractTags: data.auto_extract_tags,
    importanceBoost: data.importance_boost,
    excludePatterns: data.exclude_patterns ?? undefined,
    requirePatterns: data.require_patterns ?? undefined,
    enabled: data.enabled,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

export async function createAutoGenerationRule(
  rule: Omit<AutoGenerationRule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AutoGenerationRule> {
  const { data, error } = await supabase
    .from('auto_generation_rules')
    .insert({
      name: rule.name,
      description: rule.description ?? null,
      source_type: rule.sourceType,
      min_message_count: rule.minMessageCount,
      min_content_length: rule.minContentLength,
      auto_summarize: rule.autoSummarize,
      auto_extract_tags: rule.autoExtractTags,
      importance_boost: rule.importanceBoost,
      exclude_patterns: rule.excludePatterns ?? null,
      require_patterns: rule.requirePatterns ?? null,
      enabled: rule.enabled,
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    sourceType: data.source_type,
    minMessageCount: data.min_message_count,
    minContentLength: data.min_content_length,
    autoSummarize: data.auto_summarize,
    autoExtractTags: data.auto_extract_tags,
    importanceBoost: data.importance_boost,
    excludePatterns: data.exclude_patterns ?? undefined,
    requirePatterns: data.require_patterns ?? undefined,
    enabled: data.enabled,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

export async function updateAutoGenerationRule(
  id: string, 
  updates: Partial<Omit<AutoGenerationRule, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<AutoGenerationRule> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
  if (updates.sourceType !== undefined) dbUpdates.source_type = updates.sourceType;
  if (updates.minMessageCount !== undefined) dbUpdates.min_message_count = updates.minMessageCount;
  if (updates.minContentLength !== undefined) dbUpdates.min_content_length = updates.minContentLength;
  if (updates.autoSummarize !== undefined) dbUpdates.auto_summarize = updates.autoSummarize;
  if (updates.autoExtractTags !== undefined) dbUpdates.auto_extract_tags = updates.autoExtractTags;
  if (updates.importanceBoost !== undefined) dbUpdates.importance_boost = updates.importanceBoost;
  if (updates.excludePatterns !== undefined) dbUpdates.exclude_patterns = updates.excludePatterns ?? null;
  if (updates.requirePatterns !== undefined) dbUpdates.require_patterns = updates.requirePatterns ?? null;
  if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;

  const { data, error } = await supabase
    .from('auto_generation_rules')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    sourceType: data.source_type,
    minMessageCount: data.min_message_count,
    minContentLength: data.min_content_length,
    autoSummarize: data.auto_summarize,
    autoExtractTags: data.auto_extract_tags,
    importanceBoost: data.importance_boost,
    excludePatterns: data.exclude_patterns ?? undefined,
    requirePatterns: data.require_patterns ?? undefined,
    enabled: data.enabled,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

export async function deleteAutoGenerationRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('auto_generation_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// CARD GENERATION QUEUE
// ============================================

export async function enqueueCardGeneration(
  sourceType: CardSourceType,
  sourceId: string,
  rawData: Record<string, unknown>,
  options?: {
    sessionId?: string;
    priority?: number;
  }
): Promise<CardGenerationQueue> {
  const { data, error } = await supabase
    .from('card_generation_queue')
    .insert({
      source_type: sourceType,
      source_id: sourceId,
      session_id: options?.sessionId ?? 'default',
      raw_data: rawData,
      priority: options?.priority ?? 5,
      status: 'pending',
      retry_count: 0,
      max_retries: 3,
    })
    .select()
    .single();

  if (error) throw error;
  return dbQueueItemToQueueItem(data as DbCardGenerationQueue);
}

export async function fetchPendingQueueItems(limit: number = 10): Promise<CardGenerationQueue[]> {
  const { data, error } = await supabase
    .from('card_generation_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as DbCardGenerationQueue[]).map(dbQueueItemToQueueItem);
}

export async function updateQueueItemStatus(
  id: string,
  status: CardGenerationQueue['status'],
  options?: {
    cardId?: string;
    errorMessage?: string;
    incrementRetry?: boolean;
  }
): Promise<CardGenerationQueue> {
  const updates: Record<string, unknown> = { status };
  
  if (status === 'processing') {
    updates.processing_started_at = new Date().toISOString();
  }
  
  if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }
  
  if (options?.cardId !== undefined) {
    updates.card_id = options.cardId;
  }
  
  if (options?.errorMessage !== undefined) {
    updates.error_message = options.errorMessage;
  }
  
  if (options?.incrementRetry) {
    updates.retry_count = supabase.rpc('increment', { row_id: id });
  }

  const { data, error } = await supabase
    .from('card_generation_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return dbQueueItemToQueueItem(data as DbCardGenerationQueue);
}

export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  const { data, error } = await supabase
    .from('card_generation_queue')
    .select('status');

  if (error) throw error;

  const stats = { pending: 0, processing: 0, completed: 0, failed: 0 };
  
  data?.forEach((row: { status: string }) => {
    if (row.status in stats) {
      stats[row.status as keyof typeof stats]++;
    }
  });

  return stats;
}
