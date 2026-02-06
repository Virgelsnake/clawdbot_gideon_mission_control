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
  source?: string;
  currentModel?: string;
  configuredModels?: string[];
  models: Array<{ id: string; label: string; configured: boolean; tags: string }>;
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

export type ModelHealthEntry = {
  id: string;
  alive: boolean;
  latencyMs: number | null;
  error?: string;
};

export type ModelHealthResponse = {
  ok: boolean;
  models: ModelHealthEntry[];
};

export async function fetchModelHealth(): Promise<ModelHealthResponse> {
  const res = await fetch('/api/models/health', {
    method: 'GET',
    headers: { 'Cache-Control': 'no-store' },
  });

  const data = await res.json();
  return data;
}

export type ModelSwitchResponse = {
  ok: boolean;
  model: string;
  warning?: string;
  stdout?: string;
  stderr?: string;
  dbError?: string;
};

export async function requestModelSwitch(model: string): Promise<ModelSwitchResponse> {
  const res = await fetch('/api/model-switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Model switch failed');
  }
  return data as ModelSwitchResponse;
}
