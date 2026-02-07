import { getAllModels, getConfiguredModels } from '@/lib/gateway/model-cache';

export type ModelEntry = {
  id: string;
  label: string;
  configured: boolean;
  tags: string;
};

export async function GET() {
  try {
    // Gateway config is the source of truth for what's actually usable
    const { configuredModels, primaryModel } = await getConfiguredModels();

    // CLI gives the full catalogue (cached, may be empty on first call)
    const { models: allModels, source } = await getAllModels();

    // Build entries: configured models first, then the rest from CLI
    const seen = new Set<string>();
    const entries: ModelEntry[] = [];

    // Always include configured models (even if CLI hasn't loaded yet)
    for (const id of configuredModels) {
      seen.add(id);
      const cliMatch = allModels.find((m) => m.id === id);
      entries.push({
        id,
        label: cliMatch?.name || id,
        configured: true,
        tags: cliMatch?.tags.join(',') || 'configured',
      });
    }

    // Add remaining CLI models marked as not configured
    for (const m of allModels) {
      if (seen.has(m.id)) continue;
      if (!m.available) continue; // skip models without valid auth
      seen.add(m.id);
      entries.push({
        id: m.id,
        label: m.name || m.id,
        configured: false,
        tags: m.tags.join(','),
      });
    }

    return Response.json(
      {
        ok: true,
        source,
        currentModel: primaryModel,
        configuredModels,
        models: entries.length > 0 ? entries : [{ id: 'default', label: 'default', configured: false, tags: '' }],
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    console.error('[/api/models] Error fetching models:', err instanceof Error ? err.message : String(err));
    return Response.json(
      {
        ok: true,
        source: 'fallback',
        currentModel: 'default',
        configuredModels: [],
        models: [{ id: 'default', label: 'default', configured: false, tags: '' }],
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
