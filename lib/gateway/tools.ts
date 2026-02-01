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
  sessionKey?: string
): Promise<ToolInvokeResponse> {
  const res = await gatewayFetch('/tools/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool,
      action: 'json',
      args,
      ...(sessionKey ? { sessionKey } : {}),
    }),
  });

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
