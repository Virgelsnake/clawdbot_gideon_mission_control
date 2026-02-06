import { gatewayFetch } from '@/lib/gateway/client';

export type ToolInvokeResponse = {
  ok: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
};

export async function gatewayToolInvoke(
  tool: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>,
  sessionKey?: string,
  timeoutMs = 60_000
): Promise<ToolInvokeResponse> {
  console.log(`[DIAG][gatewayToolInvoke] tool=${tool}, timeout=${timeoutMs}, args=${JSON.stringify(args).slice(0, 200)}`);
  const res = await gatewayFetch('/tools/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool,
      action: 'json',
      args,
      ...(sessionKey ? { sessionKey } : {}),
    }),
  }, timeoutMs);

  if (!res.ok) {
    const text = await res.text();
    console.error(`[DIAG][gatewayToolInvoke] Non-OK response: status=${res.status}, body-snippet=${text.slice(0, 200)}`);
    throw new Error(`Tool invoke failed: ${res.status} ${text.slice(0, 100)}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    const text = await res.text();
    console.error(`[DIAG][gatewayToolInvoke] Non-JSON content-type: ${contentType}, body-snippet=${text.slice(0, 200)}`);
    throw new Error(`Tool invoke returned non-JSON: content-type=${contentType}`);
  }

  return res.json();
}

type ToolContentText = { type?: string; text?: string };

type ToolResult = {
  content?: ToolContentText[];
};

export function extractToolJson<T>(toolInvoke: ToolInvokeResponse): T {
  const result = toolInvoke?.result as ToolResult | undefined;
  const txt = result?.content?.find((c) => c?.type === 'text')?.text;
  if (!txt) throw new Error('TOOL_INVOKE_NO_TEXT');
  return JSON.parse(txt) as T;
}
