# Phase 3 Implementation Tasks — Autonomous Agent & Activity Log

**Source PRD:** `tasks/prd-phase3-autonomous-agent-and-activity-log.md`
**Created:** 7 February 2026
**Status:** Ready for execution
**Depends on:** Phase 2 (Shared Persistence & Integration) — assumed stable

---

## Notes / Changes

- Branch `phase3/autonomous-agent` created from `phase4/cloud-deployment` (not `main`) because Phase 3 depends on Phase 2 code which lives on that branch.
- Pre-existing test failures: 16 tests fail due to missing SettingsProvider in test wrappers (not Phase 3 related).

---

## 0. Pre-Flight

- [x] **0.1** Baseline health check — run `npm run build`, `npm test`, `npx tsc --noEmit`, `npm run lint` and confirm all pass (or document pre-existing failures)
  - Build: ✅ clean. TSC: ✅ exit 0 (stale .next/types warnings only). Tests: ⚠️ 16 pre-existing failures (missing SettingsProvider in test wrappers). Lint: ⚠️ pre-existing warnings/errors.
- [x] **0.2** Create feature branch `phase3/autonomous-agent` from main
- [x] **0.3** Confirm Supabase project is accessible and env vars are configured in `.env.local`
- [x] **0.4** Confirm existing tables (`tasks`, `ideas`, `agent_state`, `messages`) are present and healthy
- [x] **0.5** Verify Supabase Realtime is enabled on `tasks`, `ideas`, `agent_state`

---

## 1. Activity Log — Database & Server-Side Logging

> **Maps to:** FR-3.1, FR-3.2, FR-3.3
> **Directly affected:** Supabase schema, `lib/supabase/activity-log.ts` (new), `types/index.ts`, existing API routes
> **Indirect consumers:** Activity log UI (Section 5), Gideon's direct mutations

### 1a. Schema & Types

- [x] **1.1** Create `activity_log` table in Supabase via migration:
  ```sql
  CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    changes JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
  Add index on `created_at DESC` for efficient querying. Enable RLS (permissive for Phase 3).
- [x] **1.2** Enable Supabase Realtime on `activity_log` table (FR-3.7)
- [x] **1.3** Add `DbActivityLog` and `ActivityLog` types to `types/index.ts`; add `ActivityLogAction` and `ActivityLogEntityType` union types
- [x] **1.4** Create `lib/supabase/activity-log.ts` with:
  - `logActivity(entry)` — insert a log entry
  - `fetchActivityLog(filters?)` — query with optional filters (actor, action, entity_type, date range), ordered by `created_at DESC`, with pagination (limit/offset)
  - `subscribeActivityLog(onChange)` — Realtime subscription
  - DB-to-app mapper functions

### 1b. Instrument Existing API Routes

- [x] **1.5** Add activity logging to task mutations in `contexts/task-context.tsx` or the underlying `lib/supabase/tasks.ts`:
  - `createTask` → log `task_created` with actor='steve', metadata includes task title
  - `updateTask` → log `task_updated` with before/after changes JSONB
  - `deleteTask` → log `task_deleted` with metadata includes task title
  - `moveTask` (column change) → log `status_changed` with old/new column
- [x] **1.6** Add activity logging to idea mutations in `lib/supabase/ideas.ts`:
  - `createIdea` → log `idea_created`
  - `updateIdea` (archive) → log `idea_archived`
  - `updateIdea` (convert) → log `idea_converted`
  - `deleteIdea` → log `idea_deleted` (if applicable)
- [x] **1.7** Add activity logging to model switch in `app/api/model-switch/route.ts`:
  - Log `model_switched` with old/new model in changes, actor='steve'
- [x] **1.8** Validate: create/update/delete a task → verify `activity_log` rows appear in Supabase dashboard with correct actor, action, and changes

**⏸ CHECKPOINT — Section 1 complete. Stop for approval.**

---

## 2. Task Comments — Database & UI

> **Maps to:** FR-5.1, FR-5.2, FR-5.3, FR-5.4
> **Directly affected:** Supabase schema, `lib/supabase/task-comments.ts` (new), `types/index.ts`, `components/kanban/task-card.tsx`, new task detail view
> **Indirect consumers:** Gideon's progress notes (Section 4)

### 2a. Schema & Data Layer

- [x] **2.1** Create `task_comments` table in Supabase via migration:
  ```sql
  CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
  Add index on `(task_id, created_at ASC)`. Enable RLS (permissive).
- [x] **2.2** Enable Supabase Realtime on `task_comments` table (FR-5.4)
- [x] **2.3** Add `DbTaskComment` and `TaskComment` types to `types/index.ts`
- [x] **2.4** Create `lib/supabase/task-comments.ts` with:
  - `fetchComments(taskId)` — ordered by `created_at ASC`
  - `createComment(taskId, author, content)` — insert + return
  - `subscribeTaskComments(taskId, onChange)` — Realtime subscription filtered by `task_id`
  - DB-to-app mapper functions

### 2b. Task Detail View & Comments UI

- [x] **2.5** Create `components/kanban/task-detail-dialog.tsx` — a dialog/sheet that shows full task details (title, description, assignee, priority, due date, labels) and a comments section below
- [x] **2.6** Wire task card click (or "View" menu item) to open task detail dialog
- [x] **2.7** Implement comments section in task detail: chronological list of comments, each showing author, content, relative timestamp
- [x] **2.8** Add comment input at bottom of comments section — text input + "Add Comment" button; author defaults to current display name from settings
- [x] **2.9** Wire Realtime subscription — new comments appear live without refresh (FR-5.4)
- [x] **2.10** Log comment creation to `activity_log` (actor, action='comment_added', entity_type='task', entity_id=task_id)
- [x] **2.11** Validate: add comment on a task → verify it appears immediately in the task detail view; verify `task_comments` and `activity_log` rows in Supabase
  - Build: ✅ clean. TSC: ✅ exit 0. Supabase migration applied, Realtime enabled.

**⏸ CHECKPOINT — Section 2 complete. Stop for approval.**

---

## 3. Autonomy Configuration — Database & Settings UI

> **Maps to:** FR-4.1, FR-4.2, FR-4.3
> **Directly affected:** Supabase schema (new fields on `agent_state` or new `agent_config` table), `types/index.ts`, `components/settings/settings-panel.tsx`, `contexts/agent-context.tsx`
> **Indirect consumers:** Gideon's nightly cycle (Section 4)

- [x] **3.1** Add autonomy config fields to `agent_state` table via migration (simpler than a new table — single-row table already exists):
  ```sql
  ALTER TABLE agent_state
    ADD COLUMN auto_pickup_enabled BOOLEAN DEFAULT true,
    ADD COLUMN max_concurrent_tasks INTEGER DEFAULT 1,
    ADD COLUMN nightly_start_hour INTEGER DEFAULT 22,
    ADD COLUMN repick_window_minutes INTEGER DEFAULT 120,
    ADD COLUMN due_date_urgency_hours INTEGER DEFAULT 48;
  ```
- [x] **3.2** Update `DbAgentState` and `AgentState` types in `types/index.ts` with the new fields
- [x] **3.3** Update `lib/supabase/agent-state.ts` — extend `updateAgentState` to accept the new fields; update mappers in `lib/supabase/mappers.ts`
- [x] **3.4** Update `contexts/agent-context.tsx` to expose autonomy config fields and a `updateAutonomyConfig()` action
- [x] **3.5** Add "Autonomy" tab to `components/settings/settings-panel.tsx` with controls:
  - Toggle: Auto-pickup enabled/disabled
  - Number input: Max concurrent tasks (1–5)
  - Number input: Nightly start hour (0–23) with friendly label (e.g., "10 PM")
  - Number input: Re-pick window (minutes, 30–240)
  - Number input: Due-date urgency window (hours, 12–96)
- [x] **3.6** Wire settings controls to `updateAutonomyConfig()` — persist to Supabase on change
- [x] **3.7** Log autonomy config changes to `activity_log` (actor='steve', action='config_updated', entity_type='agent_state')
- [x] **3.8** Validate: change autonomy settings → verify `agent_state` row updated in Supabase; verify activity log entry
  - Build: ✅ clean. TSC: ✅ exit 0. Supabase migration applied, defaults verified in DB.

**⏸ CHECKPOINT — Section 3 complete. Stop for approval.**

---

## 4. Gideon Nightly Cycle — Pickup Logic & Idea Triage

> **Maps to:** FR-1.1–FR-1.7, FR-2.1–FR-2.5
> **Directly affected:** Gideon's cron/LaunchAgent infrastructure (external to Mission Control), new API routes or documentation for Gideon's REST workflow
> **Indirect consumers:** Activity log, task comments, autonomy config

**Note:** Gideon operates outside Mission Control (via cron + REST API calls to Supabase). This section defines the **API endpoints and documentation** that Gideon consumes, and any Mission Control-side support code. Gideon's actual cron script is maintained separately in his OpenClaw workspace.

### 4a. API Support for Gideon's Pickup

- [x] **4.1** Create `app/api/agent/pickup/route.ts` — GET endpoint that returns the next eligible task for pickup based on FR-1.2 criteria:
  1. `column_status = 'todo'` AND (`assignee IS NULL` OR `assignee = 'gideon'`)
  2. Ordered by: due-date urgency (within `due_date_urgency_hours`), then priority (urgent > high > medium > low), then `created_at ASC`
  3. Respects `auto_pickup_enabled` and `max_concurrent_tasks` from `agent_state`
  4. Returns JSON: `{ task: Task | null, reason?: string }` (reason if no task available, e.g., "auto_pickup_disabled", "max_concurrent_reached", "no_eligible_tasks")
- [x] **4.2** Create `app/api/agent/complete/route.ts` — POST endpoint for Gideon to mark a task as done:
  - Accepts `{ task_id: string }`
  - Sets `column_status = 'done'`, `updated_at = now()`
  - Updates `agent_state.status = 'idle'`
  - Logs to `activity_log` (actor='gideon', action='task_completed')
  - Returns the updated task
- [x] **4.3** Create `app/api/agent/assign/route.ts` — POST endpoint for Gideon to self-assign a task:
  - Accepts `{ task_id: string }`
  - Sets `assignee = 'gideon'`, `column_status = 'in-progress'`, `updated_at = now()`
  - Updates `agent_state.status = 'active'`
  - Logs to `activity_log` (actor='gideon', action='task_assigned')
  - Returns the updated task

### 4b. Idea Triage Support

- [x] **4.4** Create `app/api/agent/ideas/route.ts` — GET endpoint returning non-archived ideas (`archived = false`) for Gideon's triage, ordered by `created_at ASC`
- [x] **4.5** Create `app/api/agent/ideas/triage/route.ts` — POST endpoint for Gideon to perform triage actions:
  - Accepts `{ idea_id: string, action: 'archive' | 'convert', task_title?: string, task_description?: string, task_priority?: string }`
  - Archive: sets `archived = true`, `archived_at = now()`, logs `idea_archived`
  - Convert: creates new task with `created_by = 'gideon'`, links `converted_to_task_id`, logs `idea_converted`
- [x] **4.6** Add `created_by` field awareness: ensure tasks created by Gideon (`created_by = 'gideon'`) are identifiable (already exists on `tasks` table as `created_by TEXT DEFAULT 'user'`)

### 4c. Nightly Cycle Documentation

- [x] **4.7** Create `docs/GIDEON_NIGHTLY_CYCLE.md` documenting:
  - The nightly cycle flow (read config → triage ideas → pick up task → work → complete → re-pick)
  - API endpoints with request/response examples
  - How Gideon should read autonomy config from `agent_state`
  - Re-pick logic: if task completed within `repick_window_minutes` of cycle start, call `/api/agent/pickup` again
  - Error handling guidance

### 4d. Validation

- [x] **4.8** Unit test: pickup endpoint returns correct task ordering (due-date urgency before priority)
- [x] **4.9** Unit test: pickup endpoint respects `auto_pickup_enabled = false` (returns no task with reason)
- [x] **4.10** Unit test: pickup endpoint respects `max_concurrent_tasks` (returns no task when limit reached)
- [x] **4.11** Integration test: full assign → complete → re-pick flow via API
- [x] **4.12** Validate: `npm run build` clean; `npx tsc --noEmit` clean
  - Build: ✅ clean. TSC: ✅ exit 0. All 10 tests pass (7 unit + 3 integration).

**⏸ CHECKPOINT — Section 4 complete. Stop for approval.**

---

## 5. Activity Log UI — Timeline Panel

> **Maps to:** FR-3.4, FR-3.5, FR-3.6, FR-3.7
> **Directly affected:** New `components/activity/` directory, `app/(app)/page.tsx` or layout
> **Indirect consumers:** All — provides auditability for operator

### 5a. Timeline Component

- [ ] **5.1** Create `components/activity/activity-panel.tsx` — a panel/tab showing the activity feed (similar to Ideas panel placement)
- [ ] **5.2** Create `components/activity/activity-item.tsx` — individual timeline entry:
  - Avatar/icon for actor (Steve vs Gideon vs System)
  - Human-readable description (e.g., "Gideon moved 'Implement login flow' from todo to in-progress") (FR-3.6)
  - Relative timestamp (e.g., "2 minutes ago", "Yesterday at 3:14 PM")
  - Expandable changes diff (show before/after for field changes)
- [ ] **5.3** Create `lib/activity-log-formatter.ts` — utility to generate human-readable descriptions from raw activity log entries (action + entity_type + changes + metadata → readable string)
- [ ] **5.4** Implement infinite scroll or "Load more" pagination (activity_log can grow large)

### 5b. Filters

- [ ] **5.5** Create `components/activity/activity-filters.tsx` — filter bar with:
  - Actor filter: All / Steve / Gideon / System (FR-3.5)
  - Action type filter: multi-select (task_created, task_updated, status_changed, etc.)
  - Entity type filter: Task / Idea / Agent State
  - Date range filter: Today / Last 7 days / Last 30 days / Custom range
- [ ] **5.6** Wire filters to `fetchActivityLog()` query parameters

### 5c. Integration & Realtime

- [ ] **5.7** Integrate activity panel into the main layout — add as a new panel alongside Ideas (e.g., tab in the left sidebar or a dedicated panel section)
- [ ] **5.8** Wire Realtime subscription — new activity entries appear at the top of the feed live (FR-3.7)
- [ ] **5.9** Validate: perform various mutations (create task, move task, add comment, switch model) → verify all appear in activity feed with correct actor, description, and timestamp
- [ ] **5.10** Validate: apply filters → verify filtered results are correct

**⏸ CHECKPOINT — Section 5 complete. Stop for approval.**

---

## 6. UI Polish — Gideon Badges & Idea Triage Indicators

> **Maps to:** FR-2.5, Design Considerations
> **Directly affected:** `components/kanban/task-card.tsx`, `components/ideas/ideas-panel.tsx`
> **Indirect consumers:** Operator confidence (Steve can see Gideon's autonomous actions)

- [ ] **6.1** Add "Gideon suggested" badge to task cards where `created_by = 'gideon'` (FR-2.5) — subtle chip/badge, not intrusive. Extend `Task` type mapping to include `createdBy` field in the app-side type if not already exposed.
- [ ] **6.2** Update `lib/supabase/mappers.ts` to map `created_by` → `createdBy` on the Task type (verify it's already mapped; if not, add it)
- [ ] **6.3** Add Gideon actor avatar/icon to activity log entries — use a distinct icon or color (e.g., robot icon or Gideon's initials "GD" with a specific color)
- [ ] **6.4** Add "Archived by Gideon" indicator on archived ideas in the ideas panel (if archived ideas are displayed)
- [ ] **6.5** Validate: create a task via Gideon's API (simulate `created_by = 'gideon'`) → verify badge appears on task card; verify activity log shows Gideon's icon

**⏸ CHECKPOINT — Section 6 complete. Stop for approval.**

---

## 7. Final Validation & Cleanup

- [ ] **7.1** Run full test suite: `npm test` — all tests pass (or document pre-existing failures)
- [ ] **7.2** Run `npm run build` — clean build, no TypeScript errors
- [ ] **7.3** Run `npm run lint` — no lint errors (or document pre-existing)
- [ ] **7.4** Run `npx tsc --noEmit` — no type errors
- [ ] **7.5** Manual smoke test — task CRUD with activity logging: create, update, move, delete tasks → verify all logged
- [ ] **7.6** Manual smoke test — task comments: add comments, verify real-time updates
- [ ] **7.7** Manual smoke test — autonomy settings: change settings, verify persisted
- [ ] **7.8** Manual smoke test — activity log UI: filters, pagination, real-time new entries
- [ ] **7.9** Manual smoke test — Gideon API endpoints: `/api/agent/pickup`, `/api/agent/assign`, `/api/agent/complete`, `/api/agent/ideas`, `/api/agent/ideas/triage`
- [ ] **7.10** Verify `.env.local.example` updated with any new env vars (if applicable)
- [ ] **7.11** Remove any dead code or debug logging added during Phase 3
- [ ] **7.12** Commit final state on feature branch

**⏸ CHECKPOINT — Phase 3 complete. Stop for final approval before merge.**

---

## Acceptance Criteria Mapping

| AC | Description | Covered by Task(s) |
|----|-------------|---------------------|
| AC-1 | Gideon picks up unassigned 'todo' task at nightly cycle | 4.1, 4.3, 4.8 |
| AC-2 | Due-date urgency overrides priority | 4.1, 4.8 |
| AC-3 | Gideon moves completed tasks directly to 'done' | 4.2 |
| AC-4 | Re-pick logic works within 2-hour window | 4.1, 4.7, 4.11 |
| AC-5 | Gideon respects max concurrent task limit | 4.1, 4.10 |
| AC-6 | Activity log records all task mutations with correct actor | 1.5, 1.6, 1.7, 1.8 |
| AC-7 | Activity log filters work correctly | 5.5, 5.6, 5.10 |
| AC-8 | Autonomy settings are respected | 3.5, 3.6, 4.9 |
| AC-9 | Task comments appear in real-time | 2.9, 2.11 |
| AC-10 | Gideon-suggested tasks show badge | 6.1, 6.5 |
| AC-11 | Nightly idea triage runs before task pickup | 4.4, 4.5, 4.7 |

---

## App Impact Mapping

| Section | Directly Affected | Indirect Consumers |
|---------|-------------------|--------------------|
| 1 (Activity Log DB) | Supabase schema, `lib/supabase/activity-log.ts`, `types/index.ts`, API routes | Activity log UI, Gideon's mutations |
| 2 (Task Comments) | Supabase schema, `lib/supabase/task-comments.ts`, `components/kanban/task-detail-dialog.tsx` | Task cards, Gideon's progress notes |
| 3 (Autonomy Config) | `agent_state` table, `contexts/agent-context.tsx`, `components/settings/settings-panel.tsx` | Gideon's pickup logic |
| 4 (Nightly Cycle) | `app/api/agent/` routes (new), docs | Activity log, task/idea tables |
| 5 (Activity Log UI) | `components/activity/` (new), main layout | All — operator auditability |
| 6 (UI Polish) | `task-card.tsx`, `ideas-panel.tsx`, mappers | Operator confidence |
