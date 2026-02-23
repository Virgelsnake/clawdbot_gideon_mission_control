export interface TaskContextDocPayload {
  taskId: string;
  title: string;
  objective: string;
  briefPath: string;
  prdPath: string;
  taskListPath: string;
  definitionOfDone: string;
  currentState: string;
  nextActions: string;
  assignee?: string;
  priority?: string;
}

export async function createTaskContextDoc(payload: TaskContextDocPayload): Promise<{ path: string }> {
  const res = await fetch('/api/task-context-doc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to create task context doc');
  }

  return res.json();
}

export async function getTaskContextDoc(taskId: string): Promise<{ exists: boolean; path: string }> {
  const res = await fetch(`/api/task-context-doc?taskId=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) return { exists: false, path: '' };
  const body = await res.json().catch(() => ({ exists: false, path: '' }));
  return { exists: Boolean(body?.exists), path: String(body?.path || '') };
}

export async function hasTaskContextDoc(taskId: string): Promise<boolean> {
  const data = await getTaskContextDoc(taskId);
  return data.exists;
}
