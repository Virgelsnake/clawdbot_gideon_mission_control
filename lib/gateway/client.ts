type GatewayEnv = {
  url: string;
  token: string;
};

export function getGatewayEnv(): GatewayEnv {
  const url =
    process.env.OPENCLAW_GATEWAY_URL ||
    process.env.CLAWDBOT_GATEWAY_URL ||
    process.env.CLAWDBOT_API_URL ||
    'http://127.0.0.1:18789';
  const token =
    process.env.OPENCLAW_GATEWAY_TOKEN ||
    process.env.CLAWDBOT_GATEWAY_TOKEN ||
    process.env.CLAWDBOT_API_TOKEN ||
    '';
  return { url, token };
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function gatewayFetch(path: string, init: RequestInit, timeoutMs = 30000) {
  const { url, token } = getGatewayEnv();

  // Token is required for anything that actually talks to the gateway.
  if (!token) {
    throw new Error('MISSING_GATEWAY_TOKEN');
  }

  const fullUrl = `${url}${path}`;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  };

  console.log(`[DIAG][gatewayFetch] ${init.method ?? 'GET'} ${fullUrl} (timeout=${timeoutMs}ms)`);
  const res = await fetchWithTimeout(fullUrl, { ...init, headers }, timeoutMs);
  console.log(`[DIAG][gatewayFetch] Response: status=${res.status}, content-type=${res.headers.get('content-type')}`);
  return res;
}
