import { supabase } from './client';
import { dbAgentStateToAgentState } from './mappers';
import type { AgentState, DbAgentState } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const TABLE = 'agent_state';
const AGENT_ID = 'gideon';

/**
 * Fetch the current agent state row for Gideon.
 */
export async function fetchAgentState(): Promise<AgentState | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('agent_id', AGENT_ID)
    .single();

  if (error || !data) return null;
  return dbAgentStateToAgentState(data as DbAgentState);
}

/**
 * Update agent state fields (status, current_model, last_heartbeat, etc.).
 */
export async function updateAgentState(
  fields: Partial<Pick<DbAgentState, 'status' | 'current_model' | 'model_list' | 'last_heartbeat'>>
): Promise<AgentState | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('agent_id', AGENT_ID)
    .select()
    .single();

  if (error || !data) return null;
  return dbAgentStateToAgentState(data as DbAgentState);
}

/**
 * Subscribe to real-time changes on the agent_state table.
 * Returns the channel so the caller can unsubscribe.
 */
export function subscribeAgentState(
  onChange: (state: AgentState) => void
): RealtimeChannel {
  const channel = supabase
    .channel('agent-state-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE,
        filter: `agent_id=eq.${AGENT_ID}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'agent_id' in payload.new) {
          onChange(dbAgentStateToAgentState(payload.new as DbAgentState));
        }
      }
    )
    .subscribe();

  return channel;
}
