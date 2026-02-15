import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api/errors';
import { archiveCard, unarchiveCard } from '@/lib/supabase/conversation-cards';

// POST /api/second-brain/cards/archive - Archive or unarchive a card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return jsonError(400, { code: 'bad_request', message: 'id is required' });
    }
    
    const action = body.action ?? 'archive'; // 'archive' or 'unarchive'
    
    let card;
    if (action === 'archive') {
      card = await archiveCard(body.id);
    } else if (action === 'unarchive') {
      card = await unarchiveCard(body.id);
    } else {
      return jsonError(400, { code: 'bad_request', message: 'action must be archive or unarchive' });
    }
    
    return Response.json(card);
    
  } catch (err) {
    console.error('[POST /api/second-brain/cards/archive]', err);
    return jsonError(500, { 
      code: 'internal_error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
}
