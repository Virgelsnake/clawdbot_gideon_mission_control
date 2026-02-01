import { jsonError } from '@/lib/api/errors';
import { gatewayToolInvoke, extractToolJson } from '@/lib/gateway/tools';

const SESSION_KEY = process.env.CLAWDBOT_CANONICAL_SESSION_KEY || 'agent:main:main';

type SessionsHistory = {
  sessionKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
};

export async function GET() {
  try {
    const inv = await gatewayToolInvoke('sessions_history', { sessionKey: SESSION_KEY, limit: 50 });
    const hist = extractToolJson<SessionsHistory>(inv);

    return Response.json(
      {
        ok: true,
        sessionKey: SESSION_KEY,
        messages: hist.messages,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(502, { code: 'gateway_unreachable', message: 'Could not fetch session history', details: msg });
  }
}
