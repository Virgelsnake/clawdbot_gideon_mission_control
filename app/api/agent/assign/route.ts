import { supabase } from '@/lib/supabase/client';
import { dbTaskToTask } from '@/lib/supabase/mappers';
import { logActivity } from '@/lib/supabase/activity-log';
import { jsonError } from '@/lib/api/errors';
import type { DbTask } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, { code: 'bad_request', message: 'Invalid JSON body' });
  }

  const parsed = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const taskId = String(parsed.task_id ?? '').trim();

  if (!taskId) {
    return jsonError(400, { code: 'bad_request', message: 'Missing "task_id" field' });
  }

  try {
    // Assign task to gideon and move to in-progress
    const { data: taskData, error: taskErr } = await supabase
      .from('tasks')
      .update({
        assignee: 'gideon',
        column_status: 'in-progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (taskErr || !taskData) {
      return jsonError(404, {
        code: 'bad_request',
        message: 'Task not found or update failed',
        details: taskErr?.message,
      });
    }

    // Update agent_state to active
    await supabase
      .from('agent_state')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('agent_id', 'gideon');

    const task = dbTaskToTask(taskData as DbTask);

    // Log to activity_log
    logActivity({
      actor: 'gideon',
      action: 'task_assigned',
      entityType: 'task',
      entityId: taskId,
      changes: {
        assignee: { new: 'gideon' },
        column: { old: 'todo', new: 'in-progress' },
      },
      metadata: { title: task.title },
    });

    return Response.json(
      { ok: true, task },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(500, {
      code: 'internal_error',
      message: 'Unexpected error in assign endpoint',
      details: msg,
    });
  }
}
