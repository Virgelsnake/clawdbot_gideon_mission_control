import { jsonError } from '@/lib/api/errors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createConnection } from 'net';

const execAsync = promisify(exec);

const GATEWAY_PORT = parseInt(process.env.OPENCLAW_GATEWAY_PORT || '18789', 10);
const GATEWAY_HOST = '127.0.0.1';

/**
 * Fast TCP probe — checks if the gateway port is listening.
 * Resolves true/false, never throws.
 */
function probePort(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = createConnection({ host, port }, () => {
      sock.destroy();
      resolve(true);
    });
    sock.setTimeout(timeoutMs);
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
    sock.on('error', () => { resolve(false); });
  });
}

export async function GET() {
  try {
    // Fast check: is the gateway port listening?
    const portOpen = await probePort(GATEWAY_HOST, GATEWAY_PORT);

    if (!portOpen) {
      return Response.json(
        { ok: false, connected: false, error: { code: 'gateway_unreachable', message: 'Gateway port not listening' } },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Use CLI to get current model (best-effort, don't fail if CLI is slow)
    let cliModel: string | null = null;
    try {
      const { stdout } = await execAsync('/usr/local/bin/openclaw models list 2>/dev/null', {
        timeout: 8_000,
        env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ''}` },
      });
      const modelMatch = stdout.match(/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._:-]+/);
      if (modelMatch) cliModel = modelMatch[0];
    } catch {
      // CLI unavailable — try reading config file directly
      try {
        const { readFile } = await import('fs/promises');
        const raw = await readFile('/Users/gideon/.openclaw/openclaw.json', 'utf-8');
        const config = JSON.parse(raw) as { agents?: { defaults?: { model?: { primary?: string } } } };
        cliModel = config?.agents?.defaults?.model?.primary ?? null;
      } catch {
        // Config file unavailable — port probe is sufficient
      }
    }

    return Response.json(
      {
        ok: true,
        connected: true,
        currentModel: cliModel,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(502, {
      code: 'gateway_unreachable',
      message: 'Could not reach Gateway',
      details: msg,
    });
  }
}
