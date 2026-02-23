export interface TaskWorkflowMeta {
  blockedReason?: string;
  nextCheckAt?: number;
  lastActionAt?: number;
  evidenceLinks?: string[];
  notes?: string;
}

const KEY = 'mission-control-task-workflow-meta';

function readAll(): Record<string, TaskWorkflowMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, TaskWorkflowMeta>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getTaskWorkflowMeta(taskId: string): TaskWorkflowMeta {
  return readAll()[taskId] || {};
}

export function setTaskWorkflowMeta(taskId: string, meta: TaskWorkflowMeta) {
  const all = readAll();
  all[taskId] = {
    ...all[taskId],
    ...meta,
    lastActionAt: Date.now(),
  };
  writeAll(all);
}
