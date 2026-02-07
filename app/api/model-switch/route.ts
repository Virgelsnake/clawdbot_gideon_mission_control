import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { jsonError } from '@/lib/api/errors';
import { isGatewayTunnel } from '@/lib/gateway/client';

const OPENCLAW_CONFIG = '/Users/gideon/.openclaw/openclaw.json';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Allowlist pattern: alphanumeric, hyphens, dots, colons, slashes, underscores
// e.g. "gpt-4o", "claude-3.5-sonnet", "anthropic/claude-3.5-sonnet:latest"
const MODEL_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/;

/**
 * Local mode: write directly to the OpenClaw config file on the iMac.
 * Returns { ok, configuredModels } or throws.
 */
async function switchModelLocal(model: string): Promise<{ configuredModels: string[] }> {
  const { readFile, writeFile } = await import('fs/promises');

  const raw = await readFile(OPENCLAW_CONFIG, 'utf-8');
  const config = JSON.parse(raw);

  const configuredModels = Object.keys(config?.agents?.defaults?.models ?? {});
  if (configuredModels.length > 0 && !configuredModels.includes(model)) {
    throw new Error(`Model "${model}" is not in the configured models list. Available: ${configuredModels.join(', ')}`);
  }

  if (!config.agents) config.agents = {};
  if (!config.agents.defaults) config.agents.defaults = {};
  if (!config.agents.defaults.model) config.agents.defaults.model = {};
  config.agents.defaults.model.primary = model;

  await writeFile(OPENCLAW_CONFIG, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  return { configuredModels };
}

export async function POST(req: NextRequest) {
  // --- Parse body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, { code: 'bad_request', message: 'Invalid JSON body' });
  }

  const requested = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const model = String(requested.model ?? '').trim();

  // --- Validate model name ---
  if (!model) {
    return jsonError(400, { code: 'bad_request', message: 'Missing "model" field' });
  }

  if (!MODEL_NAME_PATTERN.test(model)) {
    return jsonError(400, {
      code: 'bad_request',
      message: 'Invalid model name. Must be alphanumeric with hyphens, dots, colons, slashes, or underscores (max 128 chars).',
    });
  }

  // --- Update OpenClaw config ---
  // In tunnel/production mode, we can't write to the local filesystem.
  // We update Supabase only; the agent reads current_model from agent_state.
  let configuredModels: string[] = [];

  if (!isGatewayTunnel()) {
    // Local mode: write to config file directly
    try {
      const result = await switchModelLocal(model);
      configuredModels = result.configuredModels;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('not in the configured models list')) {
        return jsonError(400, { code: 'bad_request', message: msg });
      }
      return jsonError(500, {
        code: 'config_write_failed',
        message: 'Failed to update OpenClaw config file',
        details: msg,
      });
    }
  }

  // --- Update Supabase agent_state ---
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    if (isGatewayTunnel()) {
      return jsonError(500, {
        code: 'missing_config',
        message: 'Supabase credentials required for remote model switching',
      });
    }
    return Response.json(
      { ok: true, model, warning: 'Config updated but Supabase credentials not configured' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const updatePayload: Record<string, unknown> = {
      current_model: model,
      updated_at: new Date().toISOString(),
    };
    if (configuredModels.length > 0) {
      updatePayload.model_list = configuredModels;
    }

    const { error: dbError } = await supabase
      .from('agent_state')
      .update(updatePayload)
      .eq('agent_id', 'gideon');

    if (dbError) {
      return Response.json(
        {
          ok: true,
          model,
          mode: isGatewayTunnel() ? 'tunnel' : 'local',
          warning: isGatewayTunnel() ? 'Database update failed' : 'Config updated but failed to update database',
          dbError: dbError.message,
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json(
      { ok: true, model, mode: isGatewayTunnel() ? 'tunnel' : 'local' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(500, {
      code: 'internal_error',
      message: isGatewayTunnel() ? 'Supabase update failed' : 'Config updated but Supabase update failed',
      details: msg,
    });
  }
}
