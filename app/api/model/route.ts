import { NextRequest } from 'next/server';

import { jsonError, safeReadText } from '@/lib/api/errors';
import { gatewayFetch, TimeoutError } from '@/lib/gateway/client';

// v1 approach: request a model swap by issuing a system instruction via chat.
// This keeps us compatible even if the Gateway has no dedicated model-swap endpoint.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, { code: 'bad_request', message: 'Invalid JSON body' });
  }

  const requested = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const model = String(requested.model ?? '').trim();
  if (!model) {
    return jsonError(400, { code: 'bad_request', message: 'Missing "model"' });
  }

  try {
    const res = await gatewayFetch(
      '/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Use default model for the instruction; the gateway will interpret
          // and (hopefully) switch runtime model.
          model: 'default',
          messages: [
            {
              role: 'system',
              content: 'You are Gideon. Follow the user instructions.',
            },
            {
              role: 'user',
              content: `Switch to model ${model}. Reply with a short confirmation.`,
            },
          ],
          stream: false,
        }),
      },
      30_000
    );

    if (!res.ok) {
      const text = await safeReadText(res);
      return jsonError(res.status, {
        code: 'gateway_error',
        message: 'Gateway returned an error',
        details: text,
      });
    }

    const data = await res.json();
    return Response.json(
      {
        ok: true,
        requestedModel: model,
        gatewayResponse: data,
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
