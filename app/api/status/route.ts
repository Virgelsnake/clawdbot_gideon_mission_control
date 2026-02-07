import { jsonError } from '@/lib/api/errors';
import { getGatewayEnv, isGatewayTunnel, fetchWithTimeout, TimeoutError } from '@/lib/gateway/client';

const GATEWAY_PORT = parseInt(process.env.OPENCLAW_GATEWAY_PORT || '18789', 10);
const GATEWAY_HOST = '127.0.0.1';

/**
 * Fast TCP probe — checks if the gateway port is listening.
 * Only works locally (not through tunnel). Resolves true/false, never throws.
 */
async function probePort(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  // Dynamic import — net module is only available in Node.js (local), not edge
  const { createConnection } = await import('net');
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

/**
 * HTTP health probe — checks if the gateway is reachable via tunnel URL.
 * Used in production when we can't do a TCP probe on localhost.
 */
async function probeHttp(url: string, token: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetchWithTimeout(url, { method: 'GET', headers }, timeoutMs);
    // Any response (even 4xx) means the tunnel is up and gateway is reachable
    return res.status < 500 || res.status === 502;
  } catch {
    return false;
  }
}

/**
 * Read current model from local config file (only works locally).
 */
async function readModelFromConfig(): Promise<string | null> {
  try {
    const { readFile } = await import('fs/promises');
    const raw = await readFile('/Users/gideon/.openclaw/openclaw.json', 'utf-8');
    const config = JSON.parse(raw) as { agents?: { defaults?: { model?: { primary?: string } } } };
    return config?.agents?.defaults?.model?.primary ?? null;
  } catch {
    return null;
  }
}

/**
 * Read current model from CLI (only works locally).
 */
async function readModelFromCli(): Promise<string | null> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const { stdout } = await execAsync('/usr/local/bin/openclaw models list 2>/dev/null', {
      timeout: 8_000,
      env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ''}` },
    });
    const modelMatch = stdout.match(/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._:-]+/);
    return modelMatch ? modelMatch[0] : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const { url, token } = getGatewayEnv();
  const tunnel = isGatewayTunnel();

  try {
    let connected: boolean;

    if (tunnel) {
      // Production: probe gateway via HTTP through the tunnel
      connected = await probeHttp(url, token);
    } else {
      // Local: fast TCP probe on localhost
      connected = await probePort(GATEWAY_HOST, GATEWAY_PORT);
    }

    if (!connected) {
      return Response.json(
        {
          ok: false,
          connected: false,
          mode: tunnel ? 'tunnel' : 'local',
          error: { code: 'gateway_unreachable', message: tunnel ? 'Gateway tunnel unreachable' : 'Gateway port not listening' },
        },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Get current model — only possible locally (CLI/config file)
    let currentModel: string | null = null;
    if (!tunnel) {
      currentModel = await readModelFromCli() ?? await readModelFromConfig();
    }

    return Response.json(
      {
        ok: true,
        connected: true,
        mode: tunnel ? 'tunnel' : 'local',
        currentModel,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    if (err instanceof TimeoutError) {
      return jsonError(504, { code: 'timeout', message: 'Gateway status check timed out' });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(502, {
      code: 'gateway_unreachable',
      message: 'Could not reach Gateway',
      details: msg,
    });
  }
}
