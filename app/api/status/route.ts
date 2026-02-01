import { jsonError, safeReadText } from '@/lib/api/errors';
import { gatewayFetch, TimeoutError } from '@/lib/gateway/client';

export async function GET() {
  try {
    // Best-effort: ask Gateway for its models (OpenAI-compatible). If it exists,
    // we can surface current connectivity plus the returned list.
    const res = await gatewayFetch('/v1/models', { method: 'GET' }, 10_000);

    if (!res.ok) {
      const text = await safeReadText(res);
      return Response.json(
        {
          ok: false,
          connected: false,
          error: {
            code: 'gateway_error',
            message: 'Gateway returned an error',
            details: text,
          },
        },
        { status: res.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // We don’t have a dedicated “current model” endpoint in Gateway.
    // The UI can treat this as “connected” and use its selected model state.
    const data = await res.json();

    return Response.json(
      {
        ok: true,
        connected: true,
        models: data,
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
        message: 'Server is missing CLAWDBOT_GATEWAY_TOKEN',
      });
    }

    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(502, {
      code: 'gateway_unreachable',
      message: 'Could not reach Gateway',
      details: msg,
    });
  }
}
