import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api/errors';
import { 
  processConversationForCardGeneration,
  backfillCardsFromHistory,
  generateCardFromConversation,
} from '@/lib/second-brain/generator';
import type { Message } from '@/types';

// POST /api/second-brain/generate - Trigger card generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Backfill from history
    if (body.action === 'backfill') {
      const result = await backfillCardsFromHistory(
        body.sessionId ?? 'default',
        {
          batchSize: body.batchSize ?? 100,
          since: body.since ? new Date(body.since) : undefined,
          until: body.until ? new Date(body.until) : undefined,
        }
      );
      
      return Response.json({
        success: true,
        action: 'backfill',
        result,
      });
    }
    
    // Generate from provided messages
    if (body.messages && Array.isArray(body.messages)) {
      const messages: Message[] = body.messages.map((m: Record<string, unknown>) => ({
        id: m.id as string ?? `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: m.role as Message['role'],
        content: m.content as string,
        timestamp: m.timestamp as number ?? Date.now(),
        session_id: m.session_id as string ?? 'default',
      }));
      
      const result = await processConversationForCardGeneration(
        messages,
        body.sessionId ?? 'default'
      );
      
      if (!result) {
        return Response.json({
          success: false,
          reason: 'Conversation did not meet generation criteria',
        });
      }
      
      return Response.json({
        success: true,
        card: result.card,
        tags: result.tags,
        actionItems: result.actionItems,
        questions: result.questions,
      }, { status: 201 });
    }
    
    // Generate from conversation segments directly
    if (body.segments && Array.isArray(body.segments)) {
      const result = await generateCardFromConversation({
        sourceType: body.sourceType ?? 'chat',
        sourceId: body.sourceId,
        sessionId: body.sessionId ?? 'default',
        segments: body.segments.map((s: Record<string, unknown>, index: number) => ({
          role: s.role as 'user' | 'assistant' | 'system',
          content: s.content as string,
          timestamp: s.timestamp as number ?? Date.now() + index * 1000,
        })),
        metadata: body.metadata,
      });
      
      return Response.json({
        success: true,
        card: result.card,
        tags: result.tags,
        actionItems: result.actionItems,
        questions: result.questions,
      }, { status: 201 });
    }
    
    return jsonError(400, { 
      code: 'bad_request', 
      message: 'Either messages, segments, or action=backfill is required' 
    });
    
  } catch (err) {
    console.error('[POST /api/second-brain/generate]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}
