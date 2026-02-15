/**
 * Second Brain Auto-Generation Engine
 * 
 * Automatically processes conversations and generates knowledge cards.
 * Features:
 * - Tag extraction from content
 * - Summary generation
 * - Importance scoring
 * - Integration with chat messages
 */

import { createCard, addTagToCard, addSegments } from '../supabase/conversation-cards';

// Stub for fetchAutoGenerationRules - returns empty array for now
async function fetchAutoGenerationRules(options?: { enabledOnly?: boolean }): Promise<any[]> {
  return [];
}
import { supabase } from '../supabase/client';
import type { 
  Message, 
  ConversationCard, 
  ConversationSegment,
  CardSourceType,
  AutoGenerationRule,
} from '@/types';

// ============================================
// TAG EXTRACTION
// ============================================

interface ExtractedTag {
  tag: string;
  confidence: number;
  source: 'keyword' | 'pattern' | 'semantic';
}

const KEYWORD_PATTERNS: Record<string, string[]> = {
  'coding': ['code', 'programming', 'developer', 'function', 'api', 'bug', 'debug', 'deploy', 'git', 'github', 'javascript', 'typescript', 'python', 'react', 'nextjs', 'database'],
  'design': ['design', 'ui', 'ux', 'interface', 'mockup', 'wireframe', 'figma', 'prototype', 'layout', 'style', 'color', 'typography'],
  'planning': ['plan', 'schedule', 'timeline', 'roadmap', 'milestone', 'deadline', 'sprint', 'goal', 'objective', 'strategy'],
  'decision': ['decide', 'decision', 'choose', 'choice', 'agreed', 'consensus', 'approved', 'rejected', 'go with', 'settled on'],
  'task': ['todo', 'task', 'action item', 'follow up', 'reminder', 'needs to', 'should do', 'must do', 'will do'],
  'idea': ['idea', 'concept', 'thought', 'brainstorm', 'innovation', 'creative', 'imagine', 'what if', 'consider'],
  'question': ['question', 'wonder', 'curious', 'how to', 'why does', 'what is', 'can we', 'should we'],
  'insight': ['realize', 'insight', 'understand', 'discovered', 'learned', 'ah-ha', 'breakthrough', 'key point'],
  'bug': ['bug', 'error', 'issue', 'problem', 'crash', 'broken', 'not working', 'failed', 'exception'],
  'feature': ['feature', 'enhancement', 'add', 'implement', 'build', 'create', 'new functionality'],
  'research': ['research', 'investigate', 'explore', 'study', 'analyze', 'look into', 'find out'],
  'learning': ['learn', 'tutorial', 'course', 'study', 'practice', 'skill', 'improvement'],
  'meeting': ['meeting', 'call', 'discussion', 'sync', 'check-in', 'standup', 'review'],
  'personal': ['personal', 'family', 'health', 'home', 'hobby', 'life', 'weekend'],
  'work': ['work', 'project', 'client', 'business', 'professional', 'career', 'job'],
};

/**
 * Extract tags from conversation content using keyword matching
 */
export function extractTags(content: string, options?: {
  minConfidence?: number;
  maxTags?: number;
}): ExtractedTag[] {
  const minConfidence = options?.minConfidence ?? 0.3;
  const maxTags = options?.maxTags ?? 5;
  const normalizedContent = content.toLowerCase();
  const extractedTags: ExtractedTag[] = [];
  const tagScores = new Map<string, number>();

  // Score tags based on keyword matches
  for (const [tag, keywords] of Object.entries(KEYWORD_PATTERNS)) {
    let score = 0;
    let matches = 0;
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matchCount = (normalizedContent.match(regex) || []).length;
      if (matchCount > 0) {
        matches += matchCount;
        // Longer keyword matches are more specific
        score += matchCount * (keyword.length / 10);
      }
    }
    
    if (matches > 0) {
      // Normalize score based on content length
      const normalizedScore = Math.min(score / (normalizedContent.length / 100), 1);
      tagScores.set(tag, normalizedScore);
    }
  }

  // Convert to ExtractedTag array
  for (const [tag, score] of tagScores.entries()) {
    if (score >= minConfidence) {
      extractedTags.push({
        tag,
        confidence: Math.round(score * 100) / 100,
        source: 'keyword',
      });
    }
  }

  // Sort by confidence and limit
  return extractedTags
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxTags);
}

/**
 * Detect action items and tasks from conversation
 */
export function extractActionItems(content: string): string[] {
  const actionItems: string[] = [];
  const lines = content.split('\n');
  
  const actionPatterns = [
    /^(?:\d+\.\s*|-|\*)\s*(?:TODO|ACTION|TASK|FOLLOW UP|NEEDS? TO|SHOULD|WILL|MUST)\s*:?\s*(.+)/i,
    /\b(?:I will|I'll|we should|we need to|let's|lets)\s+(.+?)(?:\.|$)/gi,
    /\b(remind me to|don't forget to|make sure to)\s+(.+?)(?:\.|$)/gi,
  ];
  
  for (const line of lines) {
    for (const pattern of actionPatterns) {
      if (pattern.global) {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          const item = match[1] || match[2];
          if (item && item.length > 10) {
            actionItems.push(item.trim());
          }
        }
      } else {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 10) {
          actionItems.push(match[1].trim());
        }
      }
    }
  }
  
  return [...new Set(actionItems)].slice(0, 10); // Deduplicate and limit
}

/**
 * Extract questions from conversation
 */
export function extractQuestions(content: string): string[] {
  const questions: string[] = [];
  const questionPatterns = [
    /\b(?:what|how|why|when|where|who|which|can|could|should|would|is|are|do|does|did|will|am)\s+[^?]+\?/gi,
    /\b(?:I wonder|curious about|question about)\s+(.+?)(?:\.|$)/gi,
  ];
  
  for (const pattern of questionPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const question = match[0].trim();
      if (question.length > 15 && question.length < 200) {
        questions.push(question);
      }
    }
  }
  
  return [...new Set(questions)].slice(0, 10);
}

// ============================================
// SUMMARY GENERATION
// ============================================

/**
 * Generate a summary from conversation segments
 */
export function generateSummary(segments: Array<{ role: string; content: string }>, options?: {
  maxLength?: number;
  style?: 'concise' | 'detailed' | 'bullets';
}): string {
  const maxLength = options?.maxLength ?? 200;
  const style = options?.style ?? 'concise';
  
  // Combine all content
  const fullContent = segments.map(s => s.content).join('\n');
  
  if (style === 'bullets') {
    return generateBulletSummary(segments, maxLength);
  }
  
  // Extract key sentences (simple approach: first sentence of each significant message)
  const keySentences: string[] = [];
  let totalLength = 0;
  
  for (const segment of segments) {
    if (segment.content.length < 20) continue;
    
    // Get first sentence
    const firstSentence = segment.content.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 20) {
      if (totalLength + firstSentence.length <= maxLength) {
        keySentences.push(firstSentence.trim());
        totalLength += firstSentence.length;
      } else {
        break;
      }
    }
  }
  
  if (keySentences.length === 0) {
    return fullContent.slice(0, maxLength) + (fullContent.length > maxLength ? '...' : '');
  }
  
  return keySentences.join('. ') + '.';
}

function generateBulletSummary(segments: Array<{ role: string; content: string }>, maxLength: number): string {
  const bullets: string[] = [];
  let totalLength = 0;
  
  // Extract key points from user messages
  const userMessages = segments.filter(s => s.role === 'user');
  
  for (const msg of userMessages) {
    const lines = msg.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Look for list items, important statements, or questions
      if (
        trimmed.match(/^(?:-|•|\d+\.|\*)/) ||
        trimmed.match(/\b(important|key|note|remember|decided|conclusion)\b/i) ||
        trimmed.includes('?')
      ) {
        const bullet = trimmed.replace(/^(?:-|•|\d+\.|\*)\s*/, '').trim();
        if (bullet.length > 10 && bullet.length < 150) {
          if (totalLength + bullet.length <= maxLength) {
            bullets.push(`• ${bullet}`);
            totalLength += bullet.length + 2;
          }
        }
      }
    }
  }
  
  if (bullets.length === 0) {
    // Fallback: use first user message
    const firstUser = userMessages[0];
    if (firstUser) {
      return `• ${firstUser.content.slice(0, maxLength)}${firstUser.content.length > maxLength ? '...' : ''}`;
    }
  }
  
  return bullets.join('\n');
}

/**
 * Generate a title from conversation
 */
export function generateTitle(segments: Array<{ role: string; content: string }>): string {
  // Use first user message as basis for title
  const firstUserMessage = segments.find(s => s.role === 'user');
  
  if (!firstUserMessage) {
    return 'Conversation Summary';
  }
  
  const content = firstUserMessage.content;
  
  // Extract first sentence or first 50 chars
  const firstSentence = content.split(/[.!?]/)[0];
  const title = firstSentence.length > 50 
    ? firstSentence.slice(0, 50).trim() + '...'
    : firstSentence.trim();
  
  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// ============================================
// IMPORTANCE SCORING
// ============================================

/**
 * Calculate importance score (1-5) for a conversation
 */
export function calculateImportance(
  segments: Array<{ role: string; content: string }>,
  extractedTags: ExtractedTag[]
): number {
  let score = 3; // Start at middle
  
  const fullContent = segments.map(s => s.content).join(' ').toLowerCase();
  
  // Length factor
  if (fullContent.length > 2000) score += 1;
  if (fullContent.length > 5000) score += 1;
  
  // Decision keywords increase importance
  const decisionWords = ['decided', 'decision', 'agreed', 'conclusion', 'resolved', 'final'];
  if (decisionWords.some(w => fullContent.includes(w))) score += 1;
  
  // Action items increase importance
  const actionWords = ['todo', 'action item', 'follow up', 'remind', 'schedule'];
  if (actionWords.some(w => fullContent.includes(w))) score += 1;
  
  // Tags with high confidence boost importance
  const highConfidenceTags = extractedTags.filter(t => t.confidence > 0.7);
  if (highConfidenceTags.length >= 3) score += 1;
  
  // Questions might indicate uncertainty (lower importance)
  const questionCount = (fullContent.match(/\?/g) || []).length;
  if (questionCount > 5) score -= 1;
  
  // Clamp to 1-5
  return Math.max(1, Math.min(5, score));
}

// ============================================
// CARD GENERATION
// ============================================

export interface CardGenerationInput {
  sourceType: CardSourceType;
  sourceId?: string;
  sessionId?: string;
  segments: Array<{ role: string; content: string; timestamp?: number }>;
  metadata?: Record<string, unknown>;
}

export interface CardGenerationResult {
  card: ConversationCard;
  tags: ExtractedTag[];
  actionItems: string[];
  questions: string[];
}

/**
 * Generate a conversation card from messages
 */
export async function generateCardFromConversation(
  input: CardGenerationInput
): Promise<CardGenerationResult> {
  const { sourceType, sourceId, sessionId = 'default', segments } = input;
  
  // Combine all content
  const fullContent = segments.map(s => `${s.role}: ${s.content}`).join('\n\n');
  
  // Extract metadata
  const extractedTags = extractTags(fullContent);
  const actionItems = extractActionItems(fullContent);
  const questions = extractQuestions(fullContent);
  
  // Generate content
  const title = generateTitle(segments);
  const summary = generateSummary(segments, { style: 'bullets' });
  const importance = calculateImportance(segments, extractedTags);
  
  // Get conversation date from first segment
  const conversationDate = segments[0]?.timestamp ?? Date.now();
  
  // Create the card
  const card = await createCard({
    title,
    summary,
    content: fullContent,
    sourceType,
    sourceId,
    sessionId,
    userId: 'steve', // Default user
    importance,
    status: 'active',
    conversationDate,
  });
  
  // Add tags
  const savedTags: ExtractedTag[] = [];
  for (const tag of extractedTags) {
    try {
      await addTagToCard(card.id, tag.tag, {
        confidence: tag.confidence,
        extractedBy: 'auto',
      });
      savedTags.push(tag);
    } catch (err) {
      console.warn(`Failed to add tag ${tag.tag}:`, err);
    }
  }
  
  // Add segments
  const segmentsToSave: Omit<ConversationSegment, 'id' | 'cardId' | 'createdAt'>[] = segments.map((s, index) => ({
    role: s.role as 'user' | 'assistant' | 'system',
    content: s.content,
    timestamp: s.timestamp ?? Date.now(),
    sequenceOrder: index,
    metadata: {},
  }));
  
  await addSegments(card.id, segmentsToSave);
  
  return {
    card,
    tags: savedTags,
    actionItems,
    questions,
  };
}

// ============================================
// AUTO-GENERATION TRIGGERS
// ============================================

/**
 * Check if a conversation should trigger auto-generation
 */
export async function shouldGenerateCard(
  messages: Message[],
  options?: {
    minMessages?: number;
    minContentLength?: number;
    timeThreshold?: number; // milliseconds since last generation
  }
): Promise<{ shouldGenerate: boolean; reason?: string }> {
  const minMessages = options?.minMessages ?? 3;
  const minContentLength = options?.minContentLength ?? 200;
  
  if (messages.length < minMessages) {
    return { shouldGenerate: false, reason: 'Not enough messages' };
  }
  
  const totalContent = messages.map(m => m.content).join('');
  if (totalContent.length < minContentLength) {
    return { shouldGenerate: false, reason: 'Content too short' };
  }
  
  // Check for auto-generation rules
  const rules = await fetchAutoGenerationRules({ enabledOnly: true });
  
  for (const rule of rules) {
    if (rule.sourceType !== 'any' && rule.sourceType !== 'chat') continue;
    if (messages.length < rule.minMessageCount) continue;
    if (totalContent.length < rule.minContentLength) continue;
    
    // Check exclude patterns
    if (rule.excludePatterns) {
      const shouldExclude = rule.excludePatterns.some((pattern: string) => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(totalContent);
        } catch {
          return false;
        }
      });
      if (shouldExclude) {
        return { shouldGenerate: false, reason: 'Matched exclude pattern' };
      }
    }
    
    // Check require patterns
    if (rule.requirePatterns && rule.requirePatterns.length > 0) {
      const hasRequired = rule.requirePatterns.some((pattern: string) => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(totalContent);
        } catch {
          return false;
        }
      });
      if (!hasRequired) {
        return { shouldGenerate: false, reason: 'Missing required pattern' };
      }
    }
  }
  
  return { shouldGenerate: true };
}

/**
 * Process messages and potentially generate a card
 * Call this after each new message or periodically
 */
export async function processConversationForCardGeneration(
  messages: Message[],
  sessionId: string = 'default'
): Promise<CardGenerationResult | null> {
  const check = await shouldGenerateCard(messages);
  
  if (!check.shouldGenerate) {
    console.log(`[SecondBrain] Skipping card generation: ${check.reason}`);
    return null;
  }
  
  console.log('[SecondBrain] Generating card from conversation...');
  
  const result = await generateCardFromConversation({
    sourceType: 'chat',
    sourceId: sessionId,
    sessionId,
    segments: messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
  });
  
  console.log(`[SecondBrain] Created card: ${result.card.id} with ${result.tags.length} tags`);
  
  return result;
}

// ============================================
// BATCH PROCESSING
// ============================================

/**
 * Process historical messages to backfill cards
 */
export async function backfillCardsFromHistory(
  sessionId: string = 'default',
  options?: {
    batchSize?: number;
    since?: Date;
    until?: Date;
  }
): Promise<{ processed: number; created: number }> {
  const batchSize = options?.batchSize ?? 100;
  
  let query = supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  if (options?.since) {
    query = query.gte('created_at', options.since.toISOString());
  }
  
  if (options?.until) {
    query = query.lte('created_at', options.until.toISOString());
  }
  
  const { data, error } = await query.limit(batchSize);
  
  if (error) throw error;
  if (!data || data.length === 0) {
    return { processed: 0, created: 0 };
  }
  
  // Group messages into conversations (simple: groups of messages with gaps > 30 min)
  const conversations: typeof data[] = [];
  let currentConversation: typeof data = [];
  let lastTimestamp: number | null = null;
  
  const THIRTY_MINUTES = 30 * 60 * 1000;
  
  for (const msg of data) {
    const msgTime = new Date(msg.created_at).getTime();
    
    if (lastTimestamp && msgTime - lastTimestamp > THIRTY_MINUTES) {
      if (currentConversation.length > 0) {
        conversations.push(currentConversation);
      }
      currentConversation = [msg];
    } else {
      currentConversation.push(msg);
    }
    
    lastTimestamp = msgTime;
  }
  
  if (currentConversation.length > 0) {
    conversations.push(currentConversation);
  }
  
  // Process each conversation
  let created = 0;
  for (const conversation of conversations) {
    const messages: Message[] = conversation.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
      session_id: m.session_id,
    }));
    
    const result = await processConversationForCardGeneration(messages, sessionId);
    if (result) created++;
  }
  
  return { processed: conversations.length, created };
}
