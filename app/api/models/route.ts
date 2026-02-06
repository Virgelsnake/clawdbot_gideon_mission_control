import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);
const OPENCLAW_CONFIG = '/Users/gideon/.openclaw/openclaw.json';
const OPENCLAW_CLI = '/usr/local/bin/openclaw';

// Curated model list fallback (aliases are preferred for stability).
const FALLBACK_MODELS = [
  { id: 'default', label: 'default' },
  { id: 'plan', label: 'plan' },
];

export async function GET() {
  try {
    // Use the OpenClaw CLI to discover models (gateway uses WebSocket, not HTTP REST)
    // Strategy 1: Try CLI with full path
    let models: Array<{ id: string; label: string }> = [];
    try {
      const { stdout } = await execAsync(`${OPENCLAW_CLI} models list 2>/dev/null`, {
        timeout: 10_000,
        env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ''}` },
      });
      const modelPattern = /^([a-zA-Z0-9_-]+\/[a-zA-Z0-9._:-]+)/gm;
      let match: RegExpExecArray | null;
      while ((match = modelPattern.exec(stdout)) !== null) {
        const id = match[1].trim();
        if (id) models.push({ id, label: id });
      }
    } catch {
      // CLI failed — fall through to config file
    }

    // Strategy 2: Read config file directly
    if (models.length === 0) {
      try {
        const raw = await readFile(OPENCLAW_CONFIG, 'utf-8');
        const config = JSON.parse(raw) as { agents?: { defaults?: { models?: Record<string, unknown> } } };
        const configModels = config?.agents?.defaults?.models;
        if (configModels && typeof configModels === 'object') {
          for (const id of Object.keys(configModels)) {
            if (id) models.push({ id, label: id });
          }
        }
      } catch {
        // Config file unavailable
      }
    }

    return Response.json(
      {
        ok: true,
        source: models.length > 0 ? 'gateway' : 'fallback',
        models: models.length > 0 ? models : FALLBACK_MODELS,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    // CLI unavailable or timed out — return fallback list so the UI can render
    return Response.json(
      {
        ok: true,
        source: 'fallback',
        models: FALLBACK_MODELS,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
