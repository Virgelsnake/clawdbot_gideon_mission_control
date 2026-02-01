export type StatusResponse = {
  ok: boolean;
  connected?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  models?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
};

export type ModelsResponse = {
  ok: boolean;
  source?: 'gateway' | 'fallback';
  models: Array<{ id: string; label: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warning?: any;
};

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch('/api/status', {
    method: 'GET',
    headers: { 'Cache-Control': 'no-store' },
  });

  const data = await res.json();
  return data;
}

export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch('/api/models', {
    method: 'GET',
    headers: { 'Cache-Control': 'no-store' },
  });

  const data = await res.json();
  return data;
}

export async function requestModelSwap(model: string) {
  const res = await fetch('/api/model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Model swap failed');
  }
  return data;
}
