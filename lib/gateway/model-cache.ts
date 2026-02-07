import { isGatewayTunnel } from '@/lib/gateway/client';

const OPENCLAW_CLI = '/usr/local/bin/openclaw';
const OPENCLAW_CONFIG = '/Users/gideon/.openclaw/openclaw.json';
const CACHE_TTL_MS = 120_000; // 2 minutes
const CLI_TIMEOUT_MS = 60_000; // 60s — the CLI is slow

export type CachedModel = {
  id: string;
  name: string;
  available: boolean;
  tags: string[];
};

type CLIModel = {
  key: string;
  name: string;
  input: string;
  contextWindow: number;
  local: boolean;
  available: boolean;
  tags: string[];
  missing: boolean;
};

type CLIModelsResponse = {
  count: number;
  models: CLIModel[];
};

let cachedModels: CachedModel[] | null = null;
let cacheTimestamp = 0;
let fetchPromise: Promise<CachedModel[]> | null = null;

async function fetchFromCLI(): Promise<CachedModel[]> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  const { stdout } = await execAsync(`${OPENCLAW_CLI} models list --all --json 2>/dev/null`, {
    timeout: CLI_TIMEOUT_MS,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ''}` },
  });
  const data = JSON.parse(stdout) as CLIModelsResponse;
  return data.models.map((m) => ({
    id: m.key,
    name: m.name || m.key,
    available: m.available,
    tags: m.tags,
  }));
}

async function fetchFromConfig(): Promise<CachedModel[]> {
  const { readFile } = await import('fs/promises');
  const raw = await readFile(OPENCLAW_CONFIG, 'utf-8');
  const config = JSON.parse(raw) as { agents?: { defaults?: { models?: Record<string, unknown> } } };
  const configModels = config?.agents?.defaults?.models;
  if (configModels && typeof configModels === 'object') {
    return Object.keys(configModels)
      .filter(Boolean)
      .map((id) => ({ id, name: id, available: true, tags: ['configured'] }));
  }
  return [];
}

/**
 * Get all models (cached). First call triggers a background CLI fetch.
 * Returns config-file models immediately if the CLI hasn't finished yet.
 */
export async function getAllModels(): Promise<{ models: CachedModel[]; source: 'cli' | 'config' | 'cache' }> {
  const now = Date.now();

  // Return from cache if fresh
  if (cachedModels && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return { models: cachedModels, source: 'cache' };
  }

  // If a fetch is already in progress, return config fallback or stale cache
  if (fetchPromise) {
    if (cachedModels) return { models: cachedModels, source: 'cache' };
    try {
      const configModels = await fetchFromConfig();
      return { models: configModels, source: 'config' };
    } catch {
      return { models: [], source: 'config' };
    }
  }

  // Start the CLI fetch
  fetchPromise = fetchFromCLI()
    .then((models) => {
      cachedModels = models;
      cacheTimestamp = Date.now();
      fetchPromise = null;
      console.log(`[model-cache] CLI fetch complete: ${models.length} models, ${models.filter(m => m.available).length} available`);
      return models;
    })
    .catch((err) => {
      console.error(`[model-cache] CLI fetch failed:`, err);
      fetchPromise = null;
      return [] as CachedModel[];
    });

  // While CLI is running, return config fallback or stale cache
  if (cachedModels) return { models: cachedModels, source: 'cache' };
  try {
    const configModels = await fetchFromConfig();
    return { models: configModels, source: 'config' };
  } catch {
    return { models: [], source: 'config' };
  }
}

/**
 * Get only available (auth=yes) models.
 */
export async function getAvailableModels(): Promise<{ models: CachedModel[]; source: string }> {
  const { models, source } = await getAllModels();
  return { models: models.filter((m) => m.available), source };
}

export type GatewayConfig = {
  configuredModels: string[];
  primaryModel: string;
};

/**
 * Read configured models + primary model directly from the gateway config file.
 * This is the source of truth for what the gateway can actually use.
 */
export async function getConfiguredModels(): Promise<GatewayConfig> {
  // In tunnel/production mode, we can't read the local config file.
  // Return empty defaults — model info comes from Supabase agent_state instead.
  if (isGatewayTunnel()) {
    return { configuredModels: [], primaryModel: 'default' };
  }

  const { readFile } = await import('fs/promises');
  const raw = await readFile(OPENCLAW_CONFIG, 'utf-8');
  const config = JSON.parse(raw) as {
    agents?: { defaults?: { model?: { primary?: string }; models?: Record<string, unknown> } };
  };
  const models = config?.agents?.defaults?.models;
  const configuredModels = models && typeof models === 'object' ? Object.keys(models).filter(Boolean) : [];
  const primaryModel = config?.agents?.defaults?.model?.primary || configuredModels[0] || 'default';
  return { configuredModels, primaryModel };
}

/**
 * Force a cache refresh (e.g. after model switch).
 */
export function invalidateModelCache(): void {
  cacheTimestamp = 0;
}
