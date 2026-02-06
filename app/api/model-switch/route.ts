import { NextRequest } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

import { jsonError } from '@/lib/api/errors';

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

  // --- Update OpenClaw config file directly ---
  // The openclaw CLI hangs when spawned from Node.js child_process, so we
  // write to the config file directly (same thing the CLI does internally).
  try {
    const raw = await readFile(OPENCLAW_CONFIG, 'utf-8');
    const config = JSON.parse(raw);

    // Validate the model exists in the configured models list
    const configuredModels = Object.keys(config?.agents?.defaults?.models ?? {});
    if (configuredModels.length > 0 && !configuredModels.includes(model)) {
      return jsonError(400, {
        code: 'bad_request',
        message: `Model "${model}" is not in the configured models list. Available: ${configuredModels.join(', ')}`,
      });
    }

    // Set the primary model
    if (!config.agents) config.agents = {};
    if (!config.agents.defaults) config.agents.defaults = {};
    if (!config.agents.defaults.model) config.agents.defaults.model = {};
    config.agents.defaults.model.primary = model;

    await writeFile(OPENCLAW_CONFIG, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(500, {
      code: 'config_write_failed',
      message: 'Failed to update OpenClaw config file',
      details: msg,
    });
  }

  // --- Read configured model list from config for Supabase sync ---
  let configuredModels: string[] = [];
  try {
    const raw = await readFile(OPENCLAW_CONFIG, 'utf-8');
    const config = JSON.parse(raw);
    configuredModels = Object.keys(config?.agents?.defaults?.models ?? {});
  } catch {
    // Already wrote successfully above, so this shouldn't fail
  }

  // --- Update Supabase agent_state ---
  const supabase = getSupabaseAdmin();
  if (!supabase) {
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
      // Config updated but DB update failed — report partial success
      return Response.json(
        {
          ok: true,
          model,
          warning: 'Config updated but failed to update database',
          dbError: dbError.message,
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json(
      { ok: true, model },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(500, {
      code: 'internal_error',
      message: 'Config updated but Supabase update failed',
      details: msg,
    });
  }
}
