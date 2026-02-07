import { supabase } from './client';
import type {
  ActivityLog,
  ActivityLogAction,
  ActivityLogEntityType,
  DbActivityLog,
} from '@/types';

// --- Mappers ---

export function dbActivityLogToActivityLog(row: DbActivityLog): ActivityLog {
  return {
    id: row.id,
    actor: row.actor,
    action: row.action as ActivityLogAction,
    entityType: row.entity_type as ActivityLogEntityType,
    entityId: row.entity_id ?? undefined,
    changes: row.changes ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// --- Data operations ---

export interface LogActivityEntry {
  actor: string;
  action: ActivityLogAction;
  entityType: ActivityLogEntityType;
  entityId?: string;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
  metadata?: Record<string, unknown>;
}

export async function logActivity(entry: LogActivityEntry): Promise<void> {
  const { error } = await supabase.from('activity_log').insert({
    actor: entry.actor,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    changes: entry.changes ?? null,
    metadata: entry.metadata ?? null,
  });
  if (error) {
    console.error('[activity-log] Failed to log activity:', error.message);
  }
}

export interface ActivityLogFilters {
  actor?: string;
  action?: ActivityLogAction | ActivityLogAction[];
  entityType?: ActivityLogEntityType;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export async function fetchActivityLog(
  filters?: ActivityLogFilters
): Promise<ActivityLog[]> {
  let query = supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.actor) {
    query = query.eq('actor', filters.actor);
  }
  if (filters?.action) {
    if (Array.isArray(filters.action)) {
      query = query.in('action', filters.action);
    } else {
      query = query.eq('action', filters.action);
    }
  }
  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) {
    console.error('[activity-log] Failed to fetch activity log:', error.message);
    return [];
  }
  return (data as DbActivityLog[]).map(dbActivityLogToActivityLog);
}

export function subscribeActivityLog(
  onChange: (entry: ActivityLog) => void
): () => void {
  const channel = supabase
    .channel('activity_log_realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_log' },
      (payload) => {
        const row = payload.new as DbActivityLog;
        onChange(dbActivityLogToActivityLog(row));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
