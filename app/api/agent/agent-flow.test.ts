import { describe, test, expect, vi, beforeEach } from 'vitest';

// Shared mock state to simulate DB across endpoints
let mockTasks: Record<string, Record<string, unknown>> = {};
let mockAgentState: Record<string, unknown> = {};

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

vi.mock('@/lib/supabase/activity-log', () => ({
  logActivity: vi.fn(),
}));

vi.mock('@/lib/api/errors', () => ({
  jsonError: (status: number, body: unknown) =>
    Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }),
}));

import { GET as pickup } from './pickup/route';
import { POST as assign } from './assign/route';
import { POST as complete } from './complete/route';

function resetState() {
  mockTasks = {
    'task-1': {
      id: 'task-1',
      title: 'First task',
      description: null,
      column_status: 'todo',
      priority: 'high',
      assignee: null,
      due_date: null,
      labels: [],
      created_by: 'steve',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
    },
    'task-2': {
      id: 'task-2',
      title: 'Second task',
      description: null,
      column_status: 'todo',
      priority: 'medium',
      assignee: null,
      due_date: null,
      labels: [],
      created_by: 'steve',
      created_at: '2026-02-02T00:00:00Z',
      updated_at: '2026-02-02T00:00:00Z',
    },
  };
  mockAgentState = {
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
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetState();

  mockFrom.mockImplementation((table: string) => {
    if (table === 'agent_state') {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { ...mockAgentState }, error: null }),
          }),
        }),
        update: (fields: Record<string, unknown>) => {
          Object.assign(mockAgentState, fields);
          return {
            eq: () => Promise.resolve({ error: null }),
          };
        },
      };
    }
    if (table === 'tasks') {
      return {
        select: (_sel: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            // Count in-progress tasks assigned to gideon
            const count = Object.values(mockTasks).filter(
              (t) => t.column_status === 'in-progress' && t.assignee === 'gideon'
            ).length;
            return {
              eq: () => ({
                eq: () => Promise.resolve({ count, error: null }),
              }),
            };
          }
          // Regular select — return todo tasks
          return {
            eq: () => ({
              or: () => ({
                order: () => {
                  const eligible = Object.values(mockTasks).filter(
                    (t) =>
                      t.column_status === 'todo' &&
                      (t.assignee === null || t.assignee === 'gideon')
                  );
                  return Promise.resolve({ data: eligible, error: null });
                },
              }),
            }),
          };
        },
        update: (fields: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => ({
            select: () => ({
              single: () => {
                if (mockTasks[id]) {
                  Object.assign(mockTasks[id], fields);
                  return Promise.resolve({ data: { ...mockTasks[id] }, error: null });
                }
                return Promise.resolve({ data: null, error: { message: 'Not found' } });
              },
            }),
          }),
        }),
      };
    }
    if (table === 'activity_log') {
      return {
        insert: () => Promise.resolve({ error: null }),
      };
    }
    return {};
  });
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/agent/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Agent flow: assign → complete → re-pick (4.11)', () => {
  test('full cycle: pickup → assign → complete → re-pick returns second task', async () => {
    // Step 1: Pickup — should return task-1 (high priority)
    const pickupRes1 = await pickup();
    const pickup1 = await pickupRes1.json();
    expect(pickup1.task).not.toBeNull();
    expect(pickup1.task.id).toBe('task-1');

    // Step 2: Assign task-1
    const assignRes = await assign(makeRequest({ task_id: 'task-1' }));
    const assignJson = await assignRes.json();
    expect(assignJson.ok).toBe(true);
    expect(assignJson.task.column).toBe('in-progress');
    expect(assignJson.task.assignee).toBe('gideon');

    // Verify agent state is active
    expect(mockAgentState.status).toBe('active');

    // Step 3: Complete task-1
    const completeRes = await complete(makeRequest({ task_id: 'task-1' }));
    const completeJson = await completeRes.json();
    expect(completeJson.ok).toBe(true);
    expect(completeJson.task.column).toBe('done');

    // Verify agent state is idle
    expect(mockAgentState.status).toBe('idle');

    // Step 4: Re-pick — should return task-2 (task-1 is now done)
    const pickupRes2 = await pickup();
    const pickup2 = await pickupRes2.json();
    expect(pickup2.task).not.toBeNull();
    expect(pickup2.task.id).toBe('task-2');
  });

  test('pickup returns null after all tasks are completed', async () => {
    // Complete both tasks manually
    mockTasks['task-1'].column_status = 'done';
    mockTasks['task-2'].column_status = 'done';

    const res = await pickup();
    const json = await res.json();
    expect(json.task).toBeNull();
    expect(json.reason).toBe('no_eligible_tasks');
  });

  test('assign blocks further pickup when max_concurrent_tasks=1', async () => {
    // Assign task-1 (simulating it's now in-progress)
    mockTasks['task-1'].column_status = 'in-progress';
    mockTasks['task-1'].assignee = 'gideon';

    const res = await pickup();
    const json = await res.json();
    expect(json.task).toBeNull();
    expect(json.reason).toBe('max_concurrent_reached');
  });
});
