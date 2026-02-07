import { supabase } from '@/lib/supabase/client';
import { dbTaskToTask } from '@/lib/supabase/mappers';
import { jsonError } from '@/lib/api/errors';
import type { DbTask, DbAgentState } from '@/types';

export const dynamic = 'force-dynamic';

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export async function GET() {
  try {
    // 1. Fetch agent_state for autonomy config
    const { data: agentRow, error: agentErr } = await supabase
      .from('agent_state')
      .select('*')
      .eq('agent_id', 'gideon')
      .single();

    if (agentErr || !agentRow) {
      return jsonError(500, {
        code: 'internal_error',
        message: 'Failed to fetch agent state',
        details: agentErr?.message,
      });
    }

    const state = agentRow as DbAgentState;

    // 2. Check auto_pickup_enabled
    if (!state.auto_pickup_enabled) {
      return Response.json(
        { task: null, reason: 'auto_pickup_disabled' },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 3. Check max_concurrent_tasks — count tasks currently in-progress assigned to gideon
    const { count: inProgressCount, error: countErr } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('column_status', 'in-progress')
      .eq('assignee', 'gideon');

    if (countErr) {
      return jsonError(500, {
        code: 'internal_error',
        message: 'Failed to count in-progress tasks',
        details: countErr.message,
      });
    }

    if ((inProgressCount ?? 0) >= state.max_concurrent_tasks) {
      return Response.json(
        { task: null, reason: 'max_concurrent_reached', inProgress: inProgressCount },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 4. Fetch eligible tasks: column_status = 'todo' AND (assignee IS NULL OR assignee = 'gideon')
    const { data: candidates, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('column_status', 'todo')
      .or('assignee.is.null,assignee.eq.gideon')
      .order('created_at', { ascending: true });

    if (taskErr) {
      return jsonError(500, {
        code: 'internal_error',
        message: 'Failed to fetch eligible tasks',
        details: taskErr.message,
      });
    }

    if (!candidates || candidates.length === 0) {
      return Response.json(
        { task: null, reason: 'no_eligible_tasks' },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 5. Sort: due-date urgency first, then priority, then created_at
    const now = Date.now();
    const urgencyMs = state.due_date_urgency_hours * 60 * 60 * 1000;

    const sorted = (candidates as DbTask[]).sort((a, b) => {
      const aDue = a.due_date ? new Date(a.due_date).getTime() : null;
      const bDue = b.due_date ? new Date(b.due_date).getTime() : null;
      const aUrgent = aDue !== null && (aDue - now) <= urgencyMs;
      const bUrgent = bDue !== null && (bDue - now) <= urgencyMs;

      // Urgent due-date tasks come first
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;

      // Within same urgency tier, sort by due date (earliest first) if both urgent
      if (aUrgent && bUrgent && aDue !== null && bDue !== null) {
        if (aDue !== bDue) return aDue - bDue;
      }

      // Then by priority
      const aPri = PRIORITY_ORDER[a.priority ?? 'low'] ?? 3;
      const bPri = PRIORITY_ORDER[b.priority ?? 'low'] ?? 3;
      if (aPri !== bPri) return aPri - bPri;

      // Then by created_at ASC
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const task = dbTaskToTask(sorted[0]);

    return Response.json(
      { task },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(500, {
      code: 'internal_error',
      message: 'Unexpected error in pickup endpoint',
      details: msg,
    });
  }
}
