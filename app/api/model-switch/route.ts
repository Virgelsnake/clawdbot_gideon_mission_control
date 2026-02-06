import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';

import { jsonError } from '@/lib/api/errors';

const execAsync = promisify(exec);

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
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

  // --- Execute CLI command ---
  try {
    const { stdout, stderr } = await execAsync(`openclaw models set ${model}`, {
      timeout: 15_000,
      env: { ...process.env },
    });

    // openclaw CLI may write warnings to stderr even on success — only treat non-zero exit as failure
    // (promisify(exec) rejects on non-zero exit, so reaching here means exit code 0)

    // --- Update Supabase agent_state ---
    const { error: dbError } = await getSupabaseAdmin()
      .from('agent_state')
      .update({
        current_model: model,
        updated_at: new Date().toISOString(),
      })
      .eq('agent_id', 'gideon');

    if (dbError) {
      // CLI succeeded but DB update failed — report partial success
      return Response.json(
        {
          ok: true,
          model,
          warning: 'Model set via CLI but failed to update database',
          dbError: dbError.message,
          stdout: stdout.trim(),
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json(
      {
        ok: true,
        model,
        stdout: stdout.trim(),
        stderr: stderr.trim() || undefined,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    // exec rejects on non-zero exit code or timeout
    const errObj = err as Record<string, unknown>;
    const isTimeout = errObj.killed === true;

    if (isTimeout) {
      return jsonError(504, {
        code: 'timeout',
        message: 'openclaw CLI timed out (15s)',
      });
    }

    // Non-zero exit — extract stderr
    const execErr = err as { stderr?: string; message?: string };
    const detail = execErr.stderr?.trim() || execErr.message || String(err);

    return jsonError(500, {
      code: 'internal_error',
      message: 'openclaw models set failed',
      details: detail,
    });
  }
}
