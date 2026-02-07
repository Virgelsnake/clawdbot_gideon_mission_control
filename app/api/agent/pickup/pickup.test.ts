import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOr = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/lib/supabase/mappers', () => ({
  dbTaskToTask: (row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    column: row.column_status,
    priority: row.priority ?? undefined,
    assignee: row.assignee ?? undefined,
    dueDate: row.due_date ? new Date(row.due_date as string).getTime() : undefined,
    labels: row.labels ?? [],
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }),
}));

vi.mock('@/lib/api/errors', () => ({
  jsonError: (status: number, body: unknown) =>
    Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }),
}));

import { GET } from './route';

function makeAgentState(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    agent_id: 'gideon',
    status: 'idle',
    current_model: 'claude-3-5-sonnet',
    model_list: [],
    last_heartbeat: null,
    updated_at: null,
    auto_pickup_enabled: true,
    max_concurrent_tasks: 1,
    nightly_start_hour: 22,
    repick_window_minutes: 120,
    due_date_urgency_hours: 48,
    ...overrides,
  };
}

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    title: 'Test task',
    description: null,
    column_status: 'todo',
    priority: 'medium',
    assignee: null,
    due_date: null,
    labels: [],
    created_by: 'steve',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function setupMocks(options: {
  agentState?: Record<string, unknown> | null;
  agentError?: { message: string } | null;
  inProgressCount?: number;
  countError?: { message: string } | null;
  tasks?: Record<string, unknown>[];
  taskError?: { message: string } | null;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'agent_state') {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: options.agentState ?? makeAgentState(),
                error: options.agentError ?? null,
              }),
          }),
        }),
      };
    }
    if (table === 'tasks') {
      // Need to distinguish between count query and select query
      return {
        select: (_sel: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            // Count query
            return {
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    count: options.inProgressCount ?? 0,
                    error: options.countError ?? null,
                  }),
              }),
            };
          }
          // Regular select query
          return {
            eq: () => ({
              or: () => ({
                order: () =>
                  Promise.resolve({
                    data: options.tasks ?? [],
                    error: options.taskError ?? null,
                  }),
              }),
            }),
          };
        },
      };
    }
    return {};
  });
}

describe('GET /api/agent/pickup', () => {
  test('returns no task when auto_pickup_enabled is false (4.9)', async () => {
    setupMocks({
      agentState: makeAgentState({ auto_pickup_enabled: false }),
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.task).toBeNull();
    expect(json.reason).toBe('auto_pickup_disabled');
  });

  test('returns no task when max_concurrent_tasks reached (4.10)', async () => {
    setupMocks({
      agentState: makeAgentState({ max_concurrent_tasks: 2 }),
      inProgressCount: 2,
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.task).toBeNull();
    expect(json.reason).toBe('max_concurrent_reached');
    expect(json.inProgress).toBe(2);
  });

  test('returns no task when no eligible tasks exist', async () => {
    setupMocks({ tasks: [] });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.task).toBeNull();
    expect(json.reason).toBe('no_eligible_tasks');
  });

  test('returns task sorted by due-date urgency before priority (4.8)', async () => {
    const now = new Date();
    // Task A: low priority but due in 24 hours (within 48h urgency window)
    const urgentDue = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    // Task B: urgent priority but no due date
    const taskA = makeTask({
      id: 'task-urgent-due',
      title: 'Urgent due date',
      priority: 'low',
      due_date: urgentDue,
      created_at: '2026-02-02T00:00:00Z',
    });
    const taskB = makeTask({
      id: 'task-high-pri',
      title: 'High priority no due',
      priority: 'urgent',
      due_date: null,
      created_at: '2026-02-01T00:00:00Z',
    });

    setupMocks({ tasks: [taskB, taskA] });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.task).not.toBeNull();
    expect(json.task.id).toBe('task-urgent-due');
  });

  test('sorts by priority when no due-date urgency', async () => {
    const taskLow = makeTask({
      id: 'task-low',
      priority: 'low',
      created_at: '2026-02-01T00:00:00Z',
    });
    const taskHigh = makeTask({
      id: 'task-high',
      priority: 'high',
      created_at: '2026-02-02T00:00:00Z',
    });
    const taskUrgent = makeTask({
      id: 'task-urgent',
      priority: 'urgent',
      created_at: '2026-02-03T00:00:00Z',
    });

    setupMocks({ tasks: [taskLow, taskHigh, taskUrgent] });

    const res = await GET();
    const json = await res.json();

    expect(json.task.id).toBe('task-urgent');
  });

  test('sorts by created_at when priority is equal', async () => {
    const taskOlder = makeTask({
      id: 'task-older',
      priority: 'medium',
      created_at: '2026-02-01T00:00:00Z',
    });
    const taskNewer = makeTask({
      id: 'task-newer',
      priority: 'medium',
      created_at: '2026-02-05T00:00:00Z',
    });

    setupMocks({ tasks: [taskNewer, taskOlder] });

    const res = await GET();
    const json = await res.json();

    expect(json.task.id).toBe('task-older');
  });

  test('allows pickup when in-progress count is below max', async () => {
    setupMocks({
      agentState: makeAgentState({ max_concurrent_tasks: 3 }),
      inProgressCount: 1,
      tasks: [makeTask()],
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.task).not.toBeNull();
  });
});
