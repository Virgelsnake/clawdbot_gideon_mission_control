import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api/errors';
import { 
  fetchCards, 
  fetchCardById, 
  createCard, 
  updateCard, 
  deleteCard,
  archiveCard,
  unarchiveCard,
  searchCards,
  getRecentCards,
  getCardStats,
} from '@/lib/supabase/conversation-cards';

// GET /api/second-brain/cards - List cards
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const id = searchParams.get('id');
    
    // Single card fetch
    if (id) {
      const withTags = searchParams.get('withTags') === 'true';
      const withSegments = searchParams.get('withSegments') === 'true';
      
      const card = await fetchCardById(id, { withTags, withSegments });
      
      if (!card) {
        return jsonError(404, { code: 'not_found', message: 'Card not found' });
      }
      
      return Response.json(card);
    }
    
    // Search endpoint
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      const limit = parseInt(searchParams.get('limit') ?? '20');
      const cards = await searchCards(searchQuery, limit);
      return Response.json({ cards, query: searchQuery });
    }
    
    // Recent cards endpoint
    const recent = searchParams.get('recent');
    if (recent) {
      const hours = parseInt(recent);
      const limit = parseInt(searchParams.get('limit') ?? '50');
      const cards = await getRecentCards(hours, limit);
      return Response.json({ cards, hours });
    }
    
    // Stats endpoint
    if (searchParams.get('stats') === 'true') {
      const stats = await getCardStats();
      return Response.json(stats);
    }
    
    // List cards with filters
    const filters = {
      search: searchParams.get('q') ?? undefined,
      sourceType: (searchParams.get('sourceType') as any) ?? undefined,
      status: (searchParams.get('status') as any) ?? 'active',
      importanceMin: searchParams.get('importanceMin') 
        ? parseInt(searchParams.get('importanceMin')!) 
        : undefined,
      importanceMax: searchParams.get('importanceMax') 
        ? parseInt(searchParams.get('importanceMax')!) 
        : undefined,
    };
    
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const orderBy = (searchParams.get('orderBy') as any) ?? 'created_at';
    const orderDirection = (searchParams.get('orderDirection') as any) ?? 'desc';
    const withTags = searchParams.get('withTags') === 'true';
    const withSegments = searchParams.get('withSegments') === 'true';
    
    const cards = await fetchCards({
      filters,
      limit,
      offset,
      orderBy,
      orderDirection,
      withTags,
      withSegments,
    });
    
    return Response.json({ 
      cards, 
      pagination: { limit, offset, count: cards.length } 
    });
    
  } catch (err) {
    console.error('[GET /api/second-brain/cards]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}

// POST /api/second-brain/cards - Create a card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return jsonError(400, { code: 'bad_request', message: 'title is required' });
    }
    
    if (!body.summary || typeof body.summary !== 'string') {
      return jsonError(400, { code: 'bad_request', message: 'summary is required' });
    }
    
    if (!body.content || typeof body.content !== 'string') {
      return jsonError(400, { code: 'bad_request', message: 'content is required' });
    }
    
    const card = await createCard({
      title: body.title,
      summary: body.summary,
      content: body.content,
      sourceType: body.sourceType ?? 'manual',
      sourceId: body.sourceId,
      sourceUrl: body.sourceUrl,
      sessionId: body.sessionId ?? 'default',
      userId: body.userId ?? 'steve',
      importance: body.importance ?? 3,
      status: body.status ?? 'active',
      conversationDate: body.conversationDate ?? Date.now(),
    });
    
    return Response.json(card, { status: 201 });
    
  } catch (err) {
    console.error('[POST /api/second-brain/cards]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}

// PATCH /api/second-brain/cards - Update a card
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return jsonError(400, { code: 'bad_request', message: 'id is required' });
    }
    
    const updates: Partial<Parameters<typeof updateCard>[1]> = {};
    
    if (body.title !== undefined) updates.title = body.title;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.content !== undefined) updates.content = body.content;
    if (body.sourceType !== undefined) updates.sourceType = body.sourceType;
    if (body.sourceId !== undefined) updates.sourceId = body.sourceId;
    if (body.sourceUrl !== undefined) updates.sourceUrl = body.sourceUrl;
    if (body.importance !== undefined) updates.importance = body.importance;
    if (body.status !== undefined) updates.status = body.status;
    if (body.archivedAt !== undefined) updates.archivedAt = body.archivedAt;
    
    const card = await updateCard(body.id, updates);
    
    return Response.json(card);
    
  } catch (err) {
    console.error('[PATCH /api/second-brain/cards]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}

// DELETE /api/second-brain/cards - Delete a card
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return jsonError(400, { code: 'bad_request', message: 'id is required' });
  }
  
  try {
    await deleteCard(id);
    return new Response(null, { status: 204 });
    
  } catch (err) {
    console.error('[DELETE /api/second-brain/cards]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}
