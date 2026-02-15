import { supabase } from './client';
import { dbCardToCard, dbCardTagToCardTag, dbSegmentToSegment } from './mappers';
import type { 
  ConversationCard, 
  CardTag, 
  ConversationSegment, 
  CardFilters,
  DbConversationCard,
  DbCardTag,
  DbConversationSegment,
} from '@/types';

const DEFAULT_PAGE_SIZE = 20;

// ============================================
// CONVERSATION CARDS CRUD
// ============================================

export async function fetchCards(options?: {
  filters?: CardFilters;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'conversation_date' | 'importance';
  orderDirection?: 'asc' | 'desc';
  withTags?: boolean;
  withSegments?: boolean;
}): Promise<ConversationCard[]> {
  const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
  const offset = options?.offset ?? 0;
  const orderBy = options?.orderBy ?? 'created_at';
  const orderDirection = options?.orderDirection ?? 'desc';
  const filters = options?.filters ?? {};

  let query = supabase
    .from('conversation_cards')
    .select('*');

  // Apply filters
  if (filters.search) {
    // Use full-text search
    query = query.textSearch('search_vector', filters.search, {
      type: 'websearch',
      config: 'english',
    });
  }
  
  if (filters.sourceType) {
    query = query.eq('source_type', filters.sourceType);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.importanceMin !== undefined) {
    query = query.gte('importance', filters.importanceMin);
  }
  
  if (filters.importanceMax !== undefined) {
    query = query.lte('importance', filters.importanceMax);
  }
  
  if (filters.dateFrom) {
    query = query.gte('conversation_date', new Date(filters.dateFrom).toISOString());
  }
  
  if (filters.dateTo) {
    query = query.lte('conversation_date', new Date(filters.dateTo).toISOString());
  }

  // Order and paginate
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw error;

  const cards = (data as DbConversationCard[]).map(dbCardToCard);

  // Fetch tags if requested
  if (options?.withTags && cards.length > 0) {
    const cardIds = cards.map(c => c.id);
    const { data: tagsData, error: tagsError } = await supabase
      .from('card_tags')
      .select('*')
      .in('card_id', cardIds);
    
    if (!tagsError && tagsData) {
      const tagsByCard = new Map<string, CardTag[]>();
      (tagsData as DbCardTag[]).forEach(tag => {
        const cardTag = dbCardTagToCardTag(tag);
        if (!tagsByCard.has(tag.card_id)) {
          tagsByCard.set(tag.card_id, []);
        }
        tagsByCard.get(tag.card_id)!.push(cardTag);
      });
      
      cards.forEach(card => {
        card.tags = tagsByCard.get(card.id) ?? [];
      });
    }
  }

  // Fetch segments if requested
  if (options?.withSegments && cards.length > 0) {
    const cardIds = cards.map(c => c.id);
    const { data: segmentsData, error: segmentsError } = await supabase
      .from('conversation_segments')
      .select('*')
      .in('card_id', cardIds)
      .order('sequence_order', { ascending: true });
    
    if (!segmentsError && segmentsData) {
      const segmentsByCard = new Map<string, ConversationSegment[]>();
      (segmentsData as DbConversationSegment[]).forEach(seg => {
        const segment = dbSegmentToSegment(seg);
        if (!segmentsByCard.has(seg.card_id)) {
          segmentsByCard.set(seg.card_id, []);
        }
        segmentsByCard.get(seg.card_id)!.push(segment);
      });
      
      cards.forEach(card => {
        card.segments = segmentsByCard.get(card.id) ?? [];
      });
    }
  }

  return cards;
}

export async function fetchCardById(
  id: string, 
  options?: { withTags?: boolean; withSegments?: boolean }
): Promise<ConversationCard | null> {
  const { data, error } = await supabase
    .from('conversation_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  const card = dbCardToCard(data as DbConversationCard);

  if (options?.withTags) {
    const { data: tagsData } = await supabase
      .from('card_tags')
      .select('*')
      .eq('card_id', id);
    
    if (tagsData) {
      card.tags = (tagsData as DbCardTag[]).map(dbCardTagToCardTag);
    }
  }

  if (options?.withSegments) {
    const { data: segmentsData } = await supabase
      .from('conversation_segments')
      .select('*')
      .eq('card_id', id)
      .order('sequence_order', { ascending: true });
    
    if (segmentsData) {
      card.segments = (segmentsData as DbConversationSegment[]).map(dbSegmentToSegment);
    }
  }

  return card;
}

export async function createCard(
  card: Omit<ConversationCard, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ConversationCard> {
  const { data, error } = await supabase
    .from('conversation_cards')
    .insert({
      title: card.title,
      summary: card.summary,
      content: card.content,
      source_type: card.sourceType,
      source_id: card.sourceId ?? null,
      source_url: card.sourceUrl ?? null,
      session_id: card.sessionId,
      user_id: card.userId,
      importance: card.importance,
      status: card.status,
      conversation_date: card.conversationDate ? new Date(card.conversationDate).toISOString() : new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return dbCardToCard(data as DbConversationCard);
}

export async function updateCard(
  id: string, 
  updates: Partial<Omit<ConversationCard, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ConversationCard> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.sourceType !== undefined) dbUpdates.source_type = updates.sourceType;
  if (updates.sourceId !== undefined) dbUpdates.source_id = updates.sourceId ?? null;
  if (updates.sourceUrl !== undefined) dbUpdates.source_url = updates.sourceUrl ?? null;
  if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId;
  if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
  if (updates.importance !== undefined) dbUpdates.importance = updates.importance;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.conversationDate !== undefined) {
    dbUpdates.conversation_date = new Date(updates.conversationDate).toISOString();
  }
  if (updates.archivedAt !== undefined) {
    dbUpdates.archived_at = updates.archivedAt ? new Date(updates.archivedAt).toISOString() : null;
  }

  const { data, error } = await supabase
    .from('conversation_cards')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return dbCardToCard(data as DbConversationCard);
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversation_cards')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function archiveCard(id: string): Promise<ConversationCard> {
  return updateCard(id, { 
    status: 'archived', 
    archivedAt: Date.now() 
  });
}

export async function unarchiveCard(id: string): Promise<ConversationCard> {
  return updateCard(id, { 
    status: 'active', 
    archivedAt: undefined 
  });
}

// ============================================
// CARD TAGS
// ============================================

export async function fetchTagsForCard(cardId: string): Promise<CardTag[]> {
  const { data, error } = await supabase
    .from('card_tags')
    .select('*')
    .eq('card_id', cardId);

  if (error) throw error;
  return (data as DbCardTag[]).map(dbCardTagToCardTag);
}

export async function addTagToCard(
  cardId: string, 
  tag: string, 
  options?: { confidence?: number; extractedBy?: 'auto' | 'manual' | 'ai' }
): Promise<CardTag> {
  const { data, error } = await supabase
    .from('card_tags')
    .insert({
      card_id: cardId,
      tag: tag.toLowerCase().trim(),
      confidence: options?.confidence ?? 1.0,
      extracted_by: options?.extractedBy ?? 'manual',
    })
    .select()
    .single();

  if (error) throw error;
  return dbCardTagToCardTag(data as DbCardTag);
}

export async function removeTagFromCard(cardId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('card_tags')
    .delete()
    .eq('id', tagId)
    .eq('card_id', cardId);

  if (error) throw error;
}

export async function fetchCardsByTag(tag: string): Promise<ConversationCard[]> {
  const { data, error } = await supabase
    .from('card_tags')
    .select('card_id')
    .eq('tag', tag.toLowerCase().trim());

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const cardIds = data.map(d => d.card_id);
  
  const { data: cardsData, error: cardsError } = await supabase
    .from('conversation_cards')
    .select('*')
    .in('id', cardIds)
    .eq('status', 'active');

  if (cardsError) throw cardsError;
  return (cardsData as DbConversationCard[]).map(dbCardToCard);
}

// ============================================
// CONVERSATION SEGMENTS
// ============================================

export async function fetchSegmentsForCard(cardId: string): Promise<ConversationSegment[]> {
  const { data, error } = await supabase
    .from('conversation_segments')
    .select('*')
    .eq('card_id', cardId)
    .order('sequence_order', { ascending: true });

  if (error) throw error;
  return (data as DbConversationSegment[]).map(dbSegmentToSegment);
}

export async function addSegment(
  cardId: string, 
  segment: Omit<ConversationSegment, 'id' | 'cardId' | 'createdAt'>
): Promise<ConversationSegment> {
  const { data, error } = await supabase
    .from('conversation_segments')
    .insert({
      card_id: cardId,
      role: segment.role,
      content: segment.content,
      timestamp: new Date(segment.timestamp).toISOString(),
      sequence_order: segment.sequenceOrder,
      metadata: segment.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return dbSegmentToSegment(data as DbConversationSegment);
}

export async function addSegments(
  cardId: string, 
  segments: Omit<ConversationSegment, 'id' | 'cardId' | 'createdAt'>[]
): Promise<ConversationSegment[]> {
  const inserts = segments.map((segment, index) => ({
    card_id: cardId,
    role: segment.role,
    content: segment.content,
    timestamp: new Date(segment.timestamp).toISOString(),
    sequence_order: segment.sequenceOrder ?? index,
    metadata: segment.metadata ?? {},
  }));

  const { data, error } = await supabase
    .from('conversation_segments')
    .insert(inserts)
    .select();

  if (error) throw error;
  return (data as DbConversationSegment[]).map(dbSegmentToSegment);
}

// ============================================
// SEARCH
// ============================================

export async function searchCards(query: string, limit: number = 20): Promise<ConversationCard[]> {
  const { data, error } = await supabase
    .from('conversation_cards')
    .select('*')
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english',
    })
    .eq('status', 'active')
    .limit(limit);

  if (error) throw error;
  return (data as DbConversationCard[]).map(dbCardToCard);
}

export async function getRecentCards(hours: number = 24, limit: number = 50): Promise<ConversationCard[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('conversation_cards')
    .select('*')
    .gte('created_at', cutoff)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as DbConversationCard[]).map(dbCardToCard);
}

// ============================================
// STATISTICS
// ============================================

export async function getCardStats(): Promise<{
  total: number;
  active: number;
  archived: number;
  bySource: Record<string, number>;
  byImportance: Record<number, number>;
}> {
  const { data: totalData, error: totalError } = await supabase
    .from('conversation_cards')
    .select('status, source_type, importance', { count: 'exact' });

  if (totalError) throw totalError;

  const stats = {
    total: 0,
    active: 0,
    archived: 0,
    bySource: {} as Record<string, number>,
    byImportance: {} as Record<number, number>,
  };

  totalData?.forEach((row: { status: string; source_type: string; importance: number }) => {
    stats.total++;
    if (row.status === 'active') stats.active++;
    if (row.status === 'archived') stats.archived++;
    
    stats.bySource[row.source_type] = (stats.bySource[row.source_type] || 0) + 1;
    stats.byImportance[row.importance] = (stats.byImportance[row.importance] || 0) + 1;
  });

  return stats;
}
