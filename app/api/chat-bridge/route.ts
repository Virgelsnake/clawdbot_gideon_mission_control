import { NextRequest } from 'next/server';

import { jsonError } from '@/lib/api/errors';
import { gatewayToolInvoke, extractToolJson } from '@/lib/gateway/tools';

const SESSION_KEY =
  process.env.OPENCLAW_CANONICAL_SESSION_KEY ||
  process.env.CLAWDBOT_CANONICAL_SESSION_KEY ||
  'agent:main:main';
const TELEGRAM_ECHO_TARGET =
  process.env.OPENCLAW_TELEGRAM_ECHO_TARGET ||
  process.env.CLAWDBOT_TELEGRAM_ECHO_TARGET ||
  '';

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

function isNoiseText(txt: string): boolean {
  const t = txt.trim();
  return t === 'ANNOUNCE_SKIP' || t.startsWith('ANNOUNCE_');
}

function pickLatestAssistantText(hist: SessionsHistory, minTimestampMs: number): string | null {
  // Walk newest→oldest and find the first assistant message with a text block.
  for (let i = hist.messages.length - 1; i >= 0; i--) {
    const m = hist.messages[i] as Msg;
    if (m?.role !== 'assistant') continue;
    const ts = Number(m?.timestamp ?? 0);
    if (ts && ts < minTimestampMs) continue;

    const blocks = Array.isArray(m?.content) ? (m.content as ContentBlock[]) : [];
    const txt = blocks.find((b) => b?.type === 'text')?.text;
    if (!txt) continue;
    const s = String(txt);
    if (isNoiseText(s)) continue;
    return s;
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

  // Echo the user message into Telegram so the visible thread matches.
  // (Mission Control can't send as Steve; we send a Gideon note.)
  if (TELEGRAM_ECHO_TARGET) {
    await gatewayToolInvoke('message', {
      action: 'send',
      channel: 'telegram',
      target: TELEGRAM_ECHO_TARGET,
      message: `Steve (via Mission Control): ${message}`,
    });
  }

  // Await sessions_send — the gateway runs the agent synchronously and returns
  // the reply inline when status is "ok". Only fall back to polling on "timeout".
  console.log(`[DIAG][/api/chat-bridge] Calling sessions_send, sessionKey=${SESSION_KEY}`);

  type SendResult = { status?: string; reply?: string; sessionKey?: string };
  let sendResult: SendResult = {};

  try {
    const inv = await gatewayToolInvoke('sessions_send', {
      sessionKey: SESSION_KEY,
      message,
    }, undefined, 120_000);
    const resultJson = extractToolJson<SendResult>(inv);
    sendResult = resultJson;
    console.log(`[DIAG][/api/chat-bridge] sessions_send result: status=${resultJson.status}, reply=${String(resultJson.reply ?? '').slice(0, 100)}`);
  } catch (sendErr) {
    const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
    console.error(`[DIAG][/api/chat-bridge] sessions_send FAILED: ${msg}`);
    return jsonError(500, { code: 'internal_error', message: 'sessions_send failed', details: msg });
  }

  // If the agent replied inline, return immediately — no polling needed.
  if (sendResult.status === 'ok' && sendResult.reply) {
    return Response.json(
      { ok: true, reply: sendResult.reply, sessionKey: SESSION_KEY },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Agent timed out or no inline reply — fall back to polling session history.
  console.log(`[DIAG][/api/chat-bridge] No inline reply (status=${sendResult.status}), falling back to polling`);
  const start = Date.now();
  const deadline = start + 60_000;

  while (Date.now() < deadline) {
    let inv;
    try {
      inv = await gatewayToolInvoke('sessions_history', { sessionKey: SESSION_KEY, limit: 30 });
    } catch (histErr) {
      const msg = histErr instanceof Error ? histErr.message : String(histErr);
      console.error(`[DIAG][/api/chat-bridge] sessions_history FAILED: ${msg}`);
      return jsonError(500, { code: 'internal_error', message: 'sessions_history failed', details: msg });
    }
    const hist = extractToolJson<SessionsHistory>(inv);
    const txt = pickLatestAssistantText(hist, start);
    if (txt) {
      return Response.json(
        { ok: true, reply: txt, sessionKey: SESSION_KEY },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return jsonError(504, { code: 'timeout', message: 'Timed out waiting for response' });
}
