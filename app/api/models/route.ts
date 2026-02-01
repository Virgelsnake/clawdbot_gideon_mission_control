import { jsonError, safeReadText } from '@/lib/api/errors';
import { gatewayFetch, TimeoutError } from '@/lib/gateway/client';

// Curated model list fallback (aliases are preferred for stability).
const FALLBACK_MODELS = [
  { id: 'default', label: 'default' },
  { id: 'plan', label: 'plan' },
];

export async function GET() {
  try {
    // Try to discover from gateway if it supports /v1/models.
    const res = await gatewayFetch('/v1/models', { method: 'GET' }, 10_000);

    if (!res.ok) {
      const text = await safeReadText(res);
      return Response.json(
        {
          ok: true,
          source: 'fallback',
          warning: {
            code: 'gateway_error',
            message: 'Gateway /v1/models returned an error; using fallback list',
            details: text,
          },
          models: FALLBACK_MODELS,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const data = await res.json();

    // Normalize to an array of {id,label}
    const items: Array<{ id: string; label: string }> = Array.isArray(data?.data)
      ? data.data
          .map((m: any) => ({
            id: String(m.id ?? m.model ?? ''),
            label: String(m.id ?? m.model ?? ''),
          }))
          .filter((m: any) => m.id)
      : FALLBACK_MODELS;

    return Response.json(
      {
        ok: true,
        source: 'gateway',
        models: items.length ? items : FALLBACK_MODELS,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    if (err instanceof TimeoutError) {
      return jsonError(504, { code: 'timeout', message: 'Gateway request timed out' });
    }

    if (err instanceof Error && err.message === 'MISSING_GATEWAY_TOKEN') {
      return jsonError(500, {
        code: 'missing_config',
        message: 'Server is missing CLAWDBOT_API_TOKEN',
      });
    }

    // If the gateway is unreachable entirely, still return a fallback list
    // so the UI can render.
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
