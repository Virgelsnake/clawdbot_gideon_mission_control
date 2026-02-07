import { supabase } from '@/lib/supabase/client';
import { dbIdeaToIdea } from '@/lib/supabase/mappers';
import { jsonError } from '@/lib/api/errors';
import type { DbIdea } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: true });

    if (error) {
      return jsonError(500, {
        code: 'internal_error',
        message: 'Failed to fetch ideas',
        details: error.message,
      });
    }

    const ideas = (data as DbIdea[]).map(dbIdeaToIdea);

    return Response.json(
      { ideas },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(500, {
      code: 'internal_error',
      message: 'Unexpected error in ideas endpoint',
      details: msg,
    });
  }
}
