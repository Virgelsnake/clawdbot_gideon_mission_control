import { NextRequest } from 'next/server';

import { jsonError } from '@/lib/api/errors';
import { gatewayToolInvoke, extractToolJson } from '@/lib/gateway/tools';

const SESSION_KEY = process.env.CLAWDBOT_CANONICAL_SESSION_KEY || 'agent:main:main';

type SessionsHistory = {
  sessionKey: string;
  messages: unknown[];
};

type Msg = {
  role?: string;
  timestamp?: number;
  content?: unknown;
};

type ContentBlock = { type?: string; text?: string };

function pickLatestAssistantText(hist: SessionsHistory, minTimestampMs: number): string | null {
  // Walk newest→oldest and find the first assistant message with a text block.
  for (let i = hist.messages.length - 1; i >= 0; i--) {
    const m = hist.messages[i] as Msg;
    if (m?.role !== 'assistant') continue;
    const ts = Number(m?.timestamp ?? 0);
    if (ts && ts < minTimestampMs) continue;

    const blocks = Array.isArray(m?.content) ? (m.content as ContentBlock[]) : [];
    const txt = blocks.find((b) => b?.type === 'text')?.text;
    if (txt) return String(txt);
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, { code: 'bad_request', message: 'Invalid JSON body' });
  }

  const obj = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const message = String(obj.message ?? obj.text ?? '').trim();
  if (!message) {
    return jsonError(400, { code: 'bad_request', message: 'Missing message' });
  }

  // Send the user message into the canonical Telegram DM session.
  // This runs the agent in that same session context.
  await gatewayToolInvoke('sessions_send', {
    sessionKey: SESSION_KEY,
    message,
  });

  // Poll for assistant response (non-streaming v1).
  const start = Date.now();
  const deadline = start + 30_000;

  while (Date.now() < deadline) {
    const inv = await gatewayToolInvoke('sessions_history', { sessionKey: SESSION_KEY, limit: 30 });
    const hist = extractToolJson<SessionsHistory>(inv);
    const txt = pickLatestAssistantText(hist, start);
    if (txt) {
      return Response.json(
        {
          ok: true,
          reply: txt,
          sessionKey: SESSION_KEY,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // backoff
    await new Promise((r) => setTimeout(r, 350));
  }

  return jsonError(504, { code: 'timeout', message: 'Timed out waiting for response' });
}
