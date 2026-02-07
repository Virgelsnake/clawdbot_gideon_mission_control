import { getConfiguredModels } from '@/lib/gateway/model-cache';

type ModelHealth = {
  id: string;
  alive: boolean;
  latencyMs: number | null;
  error?: string;
};

/**
 * GET /api/models/health
 * Returns health status for configured models only.
 * Configured models (from gateway config) are marked alive.
 */
export async function GET() {
  try {
    const { configuredModels, primaryModel } = await getConfiguredModels();

    const results: ModelHealth[] = configuredModels.map((id) => ({
      id,
      alive: true,
      latencyMs: null,
    }));

    return Response.json(
      { ok: true, models: results, currentModel: primaryModel },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/models/health] Error:', msg);
    return Response.json(
      { ok: true, models: [], error: msg.slice(0, 200) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
