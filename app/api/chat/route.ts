import { NextRequest } from 'next/server';

import { jsonError, safeReadText } from '@/lib/api/errors';
import { gatewayFetch, TimeoutError } from '@/lib/gateway/client';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError(400, { code: 'bad_request', message: 'Invalid JSON body' });
  }

  try {
    const res = await gatewayFetch(
      '/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (body as any)?.stream ? 120_000 : 30_000
    );

    if (!res.ok) {
      const text = await safeReadText(res);
      console.error(`[DIAG][/api/chat] Gateway error: status=${res.status}, content-type=${res.headers.get('content-type')}, body-snippet=${String(text).slice(0, 200)}`);
      return jsonError(res.status, {
        code: 'gateway_error',
        message: 'Gateway returned an error',
        details: text,
      });
    }

    // Streaming passthrough
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((body as any)?.stream && res.body) {
      return new Response(res.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await res.json();
    return Response.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
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
