import { supabase } from '@/lib/supabase/client';
import { dbIdeaToIdea, dbTaskToTask } from '@/lib/supabase/mappers';
import { logActivity } from '@/lib/supabase/activity-log';
import { jsonError } from '@/lib/api/errors';
import type { DbIdea, DbTask } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, { code: 'bad_request', message: 'Invalid JSON body' });
  }

  const parsed = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const ideaId = String(parsed.idea_id ?? '').trim();
  const action = String(parsed.action ?? '').trim();

  if (!ideaId) {
    return jsonError(400, { code: 'bad_request', message: 'Missing "idea_id" field' });
  }

  if (action !== 'archive' && action !== 'convert') {
    return jsonError(400, {
      code: 'bad_request',
      message: 'Invalid "action" field. Must be "archive" or "convert".',
    });
  }

  try {
    // Fetch the idea first to verify it exists
    const { data: ideaRow, error: fetchErr } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (fetchErr || !ideaRow) {
      return jsonError(404, {
        code: 'bad_request',
        message: 'Idea not found',
        details: fetchErr?.message,
      });
    }

    const idea = ideaRow as DbIdea;

    if (action === 'archive') {
      const { data: updated, error: updateErr } = await supabase
        .from('ideas')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq('id', ideaId)
        .select()
        .single();

      if (updateErr || !updated) {
        return jsonError(500, {
          code: 'internal_error',
          message: 'Failed to archive idea',
          details: updateErr?.message,
        });
      }

      logActivity({
        actor: 'gideon',
        action: 'idea_archived',
        entityType: 'idea',
        entityId: ideaId,
        metadata: { content: idea.content.substring(0, 100) },
      });

      return Response.json(
        { ok: true, idea: dbIdeaToIdea(updated as DbIdea) },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // action === 'convert'
    const taskTitle = String(parsed.task_title ?? '').trim();
    const taskDescription = parsed.task_description ? String(parsed.task_description).trim() : undefined;
    const taskPriority = parsed.task_priority ? String(parsed.task_priority).trim() : 'medium';

    if (!taskTitle) {
      return jsonError(400, {
        code: 'bad_request',
        message: 'Missing "task_title" field for convert action',
      });
    }

    // Create the task
    const taskRow: Record<string, unknown> = {
      title: taskTitle,
      column_status: 'todo',
      priority: taskPriority,
      created_by: 'gideon',
    };
    if (taskDescription) taskRow.description = taskDescription;

    const { data: newTask, error: taskErr } = await supabase
      .from('tasks')
      .insert(taskRow)
      .select()
      .single();

    if (taskErr || !newTask) {
      return jsonError(500, {
        code: 'internal_error',
        message: 'Failed to create task from idea',
        details: taskErr?.message,
      });
    }

    const task = dbTaskToTask(newTask as DbTask);

    // Update the idea with converted_to_task_id
    const { data: updatedIdea, error: ideaUpdateErr } = await supabase
      .from('ideas')
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        converted_to_task_id: task.id,
      })
      .eq('id', ideaId)
      .select()
      .single();

    if (ideaUpdateErr) {
      console.error('[ideas/triage] Failed to update idea after conversion:', ideaUpdateErr.message);
    }

    logActivity({
      actor: 'gideon',
      action: 'idea_converted',
      entityType: 'idea',
      entityId: ideaId,
      metadata: {
        content: idea.content.substring(0, 100),
        taskId: task.id,
        taskTitle: task.title,
      },
    });

    logActivity({
      actor: 'gideon',
      action: 'task_created',
      entityType: 'task',
      entityId: task.id,
      metadata: {
        title: task.title,
        fromIdea: ideaId,
      },
    });

    return Response.json(
      {
        ok: true,
        idea: updatedIdea ? dbIdeaToIdea(updatedIdea as DbIdea) : null,
        task,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(500, {
      code: 'internal_error',
      message: 'Unexpected error in ideas triage endpoint',
      details: msg,
    });
  }
}
