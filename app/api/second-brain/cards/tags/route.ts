import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api/errors';
import { 
  fetchTagsForCard, 
  addTagToCard, 
  removeTagFromCard,
  fetchCardsByTag,
} from '@/lib/supabase/conversation-cards';

// GET /api/second-brain/cards/tags - Get tags for a card or cards by tag
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const cardId = searchParams.get('cardId');
    const tag = searchParams.get('tag');
    
    // Get tags for a specific card
    if (cardId) {
      const tags = await fetchTagsForCard(cardId);
      return Response.json({ tags, cardId });
    }
    
    // Get cards by tag
    if (tag) {
      const cards = await fetchCardsByTag(tag);
      return Response.json({ cards, tag });
    }
    
    return jsonError(400, { 
      code: 'bad_request', 
      message: 'Either cardId or tag parameter is required' 
    });
    
  } catch (err) {
    console.error('[GET /api/second-brain/cards/tags]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}

// POST /api/second-brain/cards/tags - Add a tag to a card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.cardId) {
      return jsonError(400, { code: 'bad_request', message: 'cardId is required' });
    }
    
    if (!body.tag || typeof body.tag !== 'string') {
      return jsonError(400, { code: 'bad_request', message: 'tag is required' });
    }
    
    const tag = await addTagToCard(body.cardId, body.tag, {
      confidence: body.confidence,
      extractedBy: body.extractedBy ?? 'manual',
    });
    
    return Response.json(tag, { status: 201 });
    
  } catch (err) {
    console.error('[POST /api/second-brain/cards/tags]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}

// DELETE /api/second-brain/cards/tags - Remove a tag from a card
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');
  const tagId = searchParams.get('tagId');
  
  if (!cardId || !tagId) {
    return jsonError(400, { 
      code: 'bad_request', 
      message: 'Both cardId and tagId parameters are required' 
    });
  }
  
  try {
    await removeTagFromCard(cardId, tagId);
    return new Response(null, { status: 204 });
    
  } catch (err) {
    console.error('[DELETE /api/second-brain/cards/tags]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}
