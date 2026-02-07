# PRD: Mission Control Phase 3 — Autonomous Agent & Activity Log

**Version:** 1.0
**Date:** 6 February 2026
**Author:** Cascade (AI), commissioned by Steve
**Status:** Draft — pending Phase 2 completion
**Depends on:** Phase 2 (Shared Persistence & Integration)
**Blocks:** Phase 4 (partial — activity log informs cloud deployment decisions)

---

## 1. Overview

Phase 3 elevates Gideon from a passive tool-user into an **autonomous operator** who can pick up, execute, and complete tasks without direct human instruction. It also introduces an **activity log** providing full auditability of all changes made by both Steve and Gideon.

**Problem solved:** After Phase 2, Gideon can read/write tasks but only when explicitly told to. Steve must manually assign work and monitor progress. Phase 3 enables Gideon to self-manage his workload and provides Steve with a complete audit trail of who changed what and when.

---

## 2. Platforms & Release Targets

| Platform | In Scope | Notes |
|----------|----------|-------|
| **PWA (Web)** | ✅ | Local Next.js dashboard on iMac |
| iOS / Android | ❌ | Deferred to Phase 4 |

**Deployment:** Local only (same as Phase 2).

---

## 3. Recommended Stack & Rationale

No new framework dependencies expected. Key additions:

| Layer | Addition | Rationale |
|-------|----------|-----------|
| Scheduling | **Gideon's existing cron / LaunchAgent** | Gideon already has a cron-based heartbeat; extend for task polling |
| Audit logging | **Supabase `activity_log` table** | Same DB, no new infra; queryable via REST |
| UI components | **Timeline/feed component** | New shadcn/ui-based component for activity feed |

---

## 4. Goals

1. **Autonomous task pickup** — Gideon periodically checks for unassigned tasks and self-assigns based on priority and capacity
2. **Idea management** — Gideon can triage ideas, suggest task conversions, and archive stale ideas
3. **Activity audit trail** — Every task/idea mutation is logged with actor, action, timestamp, and before/after state
4. **Operator confidence** — Steve can review Gideon's autonomous decisions and override if needed

---

## 5. User Stories & Personas

| ID | Story |
|----|-------|
| US-3.1 | As an operator, I want Gideon to automatically pick up unassigned tasks every night at 10 PM so work progresses overnight without my intervention. |
| US-3.2 | As an operator, I want to see an activity log of all changes so I can audit what Gideon has done. |
| US-3.3 | As an operator, I want to configure Gideon's autonomy level (e.g., auto-pickup on/off, nightly schedule, max concurrent tasks). |
| US-3.4 | As an operator, I want Gideon to triage the ideas backlog nightly and suggest which should become tasks. |
| US-3.5 | As an operator, I want to filter the activity log by actor (Steve vs Gideon), action type, and date range. |
| US-3.6 | As Gideon, I want to self-assign tasks from the backlog based on due-date urgency and priority so I can work autonomously. |
| US-3.7 | As Gideon, I want to move tasks directly to 'done' when complete — I am fully autonomous with no approval gate. |
| US-3.8 | As Gideon, I want to pick up another task if I finish one within 2 hours of the nightly cycle start. |
| US-3.9 | As Gideon, I want to add notes/comments to tasks to document my progress. |

---

## 6. Functional Requirements

### 6.1 Autonomous Task Pickup

- **FR-1.1:** Gideon runs a nightly task-pickup cycle triggered at **10:00 PM local time** via cron/LaunchAgent (configurable)
- **FR-1.2:** Pickup criteria: `column_status = 'todo'`, `assignee IS NULL OR assignee = 'gideon'`, ordered by:
  1. **Due-date urgency** — any task with `due_date` within the next 48 hours is promoted to the top of the queue regardless of priority level
  2. **Priority** — urgent > high > medium > low
  3. **Creation date** — `created_at` ASC (oldest first as tiebreaker)
- **FR-1.3:** Gideon respects a configurable concurrency limit (default: 1 task at a time in `in-progress`)
- **FR-1.4:** On pickup: set `assignee = 'gideon'`, `column_status = 'in-progress'`, update `agent_state.status = 'active'`
- **FR-1.5:** On completion: set `column_status = 'done'`, update `agent_state.status = 'idle'`. Gideon is fully autonomous — no human approval gate required.
- **FR-1.6:** **Re-pick logic:** If Gideon completes a task within 2 hours of the nightly cycle start, he immediately checks for the next eligible task and picks it up. This repeats until either no eligible tasks remain or the 2-hour window has elapsed since the last completion.
- **FR-1.7:** Gideon manages his own concurrency — Mission Control does not enforce guardrails (per briefing constraint)

### 6.2 Idea Management by Gideon

- **FR-2.1:** Gideon can read all non-archived ideas via REST API
- **FR-2.2:** Gideon triages the ideas backlog as part of his **nightly 10 PM cycle**, before selecting tasks. Triage includes: flagging stale ideas, suggesting task conversions, and archiving resolved/duplicate ideas.
- **FR-2.3:** Gideon can suggest task conversion by creating a task with `created_by = 'gideon'` and linking `ideas.converted_to_task_id`
- **FR-2.4:** Gideon can archive stale ideas (set `archived = true`, `archived_at = now()`)
- **FR-2.5:** UI shows a "Gideon suggested" badge on tasks created by the agent

### 6.3 Activity Log

- **FR-3.1:** New Supabase table `activity_log`:
  ```sql
  CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor TEXT NOT NULL,              -- 'steve' | 'gideon' | 'system'
    action TEXT NOT NULL,             -- 'task_created' | 'task_updated' | 'task_deleted' | 'idea_created' | 'idea_archived' | 'idea_converted' | 'status_changed' | 'model_switched'
    entity_type TEXT NOT NULL,        -- 'task' | 'idea' | 'agent_state'
    entity_id UUID,
    changes JSONB,                    -- { "field": { "old": "...", "new": "..." } }
    metadata JSONB,                   -- Additional context (e.g., task title for readability)
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- **FR-3.2:** All mutations in Mission Control API routes log to `activity_log` (server-side)
- **FR-3.3:** Gideon's direct REST mutations are also logged (via Supabase database trigger or Gideon writing to the log himself)
- **FR-3.4:** Activity log UI: timeline/feed component in a new panel or tab
- **FR-3.5:** Filters: by actor, action type, entity type, date range
- **FR-3.6:** Each log entry is human-readable (e.g., "Gideon moved 'Implement login flow' from todo to in-progress")
- **FR-3.7:** Enable Supabase Realtime on `activity_log` so new entries appear live

### 6.4 Autonomy Configuration

- **FR-4.1:** New `agent_config` table or fields on `agent_state`:
  - `auto_pickup_enabled` BOOLEAN DEFAULT true
  - `max_concurrent_tasks` INTEGER DEFAULT 1
  - `nightly_start_hour` INTEGER DEFAULT 22 — hour (0–23) in local time when the nightly cycle begins
  - `repick_window_minutes` INTEGER DEFAULT 120 — if a task completes within this window, Gideon picks up the next eligible task
  - `due_date_urgency_hours` INTEGER DEFAULT 48 — tasks with due dates within this window are promoted to top priority
- **FR-4.2:** UI settings panel to toggle autonomy settings (enable/disable auto-pickup, adjust schedule, concurrency limit)
- **FR-4.3:** Gideon reads these settings before attempting pickup

### 6.5 Task Notes / Comments

- **FR-5.1:** New `task_comments` table:
  ```sql
  CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- **FR-5.2:** Gideon can add progress notes to tasks he's working on
- **FR-5.3:** Task detail view shows comments in chronological order
- **FR-5.4:** Enable Realtime on `task_comments`

---

## 7. Acceptance Criteria & Test Strategy

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-1 | Gideon picks up an unassigned 'todo' task at the nightly 10 PM cycle | Create unassigned task → wait for 10 PM cycle → verify Gideon assigns and moves to in-progress |
| AC-2 | Due-date urgency overrides priority | Create low-priority task due in 24h and high-priority task with no due date → verify due-date task is picked first |
| AC-3 | Gideon moves completed tasks directly to 'done' | Gideon completes a task → verify `column_status = 'done'` (no review step) |
| AC-4 | Re-pick logic works within 2-hour window | Gideon completes task < 2h after cycle start → verify he picks up next eligible task |
| AC-5 | Gideon respects max concurrent task limit | Set limit to 1, create 2 tasks → verify only 1 picked up |
| AC-6 | Activity log records all task mutations with correct actor | Create/update/delete tasks as both Steve and Gideon → verify log entries |
| AC-7 | Activity log filters work correctly | Filter by actor='gideon' → verify only Gideon's actions shown |
| AC-8 | Autonomy settings are respected | Disable auto-pickup → verify Gideon stops picking up tasks |
| AC-9 | Task comments appear in real-time | Gideon adds comment → verify it appears in UI within 2s |
| AC-10 | Gideon-suggested tasks show badge | Gideon converts idea to task → verify "Gideon suggested" badge |
| AC-11 | Nightly idea triage runs before task pickup | Verify activity log shows idea triage entries timestamped before task pickup entries |

**Test approach:**
- **Unit tests:** Pickup criteria logic, log entry formatting
- **Integration tests:** Autonomy config read, activity log writes, comment CRUD
- **E2E tests:** Full autonomous pickup flow, activity log UI

---

## 8. Definition of Done

- [ ] Gideon autonomously picks up and completes tasks on his nightly 10 PM cycle
- [ ] Due-date urgency (48h window) correctly overrides priority ordering
- [ ] Re-pick logic works: Gideon picks another task if finished within 2h
- [ ] Gideon moves completed tasks directly to 'done' (no review gate)
- [ ] Nightly idea triage runs before task pickup
- [ ] Activity log captures all mutations with actor, action, and changes
- [ ] Activity log UI with filtering and real-time updates
- [ ] Autonomy configuration panel working (schedule, concurrency, enable/disable)
- [ ] Task comments system working for both Steve and Gideon
- [ ] All acceptance criteria (AC-1 through AC-11) pass
- [ ] `next build` passes cleanly
- [ ] Documentation updated for Gideon's autonomous workflow

---

## 9. Non-Goals (Out of Scope)

- **Cloud deployment** — Phase 4
- **Multi-user access control on activity log** — Phase 5
- **Automated rollback of Gideon's changes** — future consideration
- **Complex task dependencies / DAG execution** — future consideration
- **Gideon creating sub-tasks** — future consideration

---

## 10. Design Considerations

- Activity log should use a **timeline layout** similar to GitHub's activity feed or Linear's activity sidebar
- Each entry: avatar/icon (Steve vs Gideon), human-readable description, relative timestamp, expandable diff
- "Gideon suggested" badge: subtle chip on task cards, not intrusive

---

## 11. Technical Considerations

- **Database triggers vs application-level logging:** Prefer application-level (API routes + Gideon instruction) for Phase 3. Database triggers (Supabase Functions) can be added later for completeness.
- **Gideon's pickup mechanism:** Uses his existing cron/LaunchAgent infrastructure. No new daemon needed.
- **Concurrency:** Gideon manages his own — if he picks up 2 tasks despite limit=1, that's on his instruction set, not Mission Control's enforcement.

---

## 12. Implementation Notes (Non-binding)

### Suggested Sequence

1. Activity log table + API route logging (foundation for auditability)
2. Task comments table + UI
3. Autonomy config table + settings UI
4. Gideon nightly cycle logic (cron/LaunchAgent at 10 PM, idea triage → task pickup → re-pick loop)
5. Idea management by Gideon (integrated into nightly triage step)
6. Activity log UI (timeline panel)

### Nightly Cycle Flow

```
10:00 PM — Cron triggers Gideon
  ├── 1. Read autonomy config (auto_pickup_enabled, max_concurrent, etc.)
  ├── 2. Triage ideas backlog (archive stale, suggest conversions)
  ├── 3. Select highest-priority eligible task (due-date urgency → priority → age)
  ├── 4. Pick up task → work → move to 'done'
  └── 5. If completed within 2h of cycle start → goto step 3
```

### Dependency on Phase 2

All Phase 3 work assumes Phase 2's Supabase CRUD, Realtime subscriptions, and agent status are stable and tested.

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Autonomous task pickup reliability | 95%+ — Gideon picks up eligible tasks within configured interval |
| Activity log completeness | 100% — every mutation captured |
| Activity log query performance | < 500ms for filtered queries |
| Operator confidence | Steve trusts autonomous decisions (qualitative) |

---

## 14. Resolved Questions

1. **Review workflow** — ✅ **Gideon moves to 'done' directly.** He is fully autonomous — no human approval gate required.
2. **Pickup priority weighting** — ✅ **Due date within 48 hours promotes to top of queue**, regardless of priority level. After that, standard priority ordering applies.
3. **Idea triage frequency** — ✅ **Nightly at 10 PM**, as part of the same cycle as task pickup. Triage runs first, then task selection.

## 15. Open Questions

1. **Activity log retention** — Keep all logs forever, or prune after N days?

---

## 16. Appendix: Source Notes

| Source | Key Facts Extracted |
|--------|--------------------|
| `docs/PHASE2_BRIEFING_2026-02-06.md` Section 3.2 | Phase 3 scope: autonomous pickup, idea management, activity log |
| `docs/PHASE2_BRIEFING_2026-02-06.md` Section 8 | Constraint: Gideon manages own concurrency |
| Phase 2 PRD | Supabase schema baseline, Realtime architecture |
