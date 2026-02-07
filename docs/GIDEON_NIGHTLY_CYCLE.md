# Gideon Nightly Cycle — API Reference & Flow

**Last updated:** 7 February 2026
**Base URL:** Mission Control (local: `http://localhost:3000`, deployed: `https://gideon-mission-control.netlify.app`)

---

## Overview

Gideon's nightly cycle runs via cron/LaunchAgent and performs the following steps in order:

1. **Read autonomy config** from `agent_state`
2. **Triage ideas** — review unarchived ideas, archive or convert to tasks
3. **Pick up a task** — find the next eligible task based on priority rules
4. **Self-assign** — claim the task and move to in-progress
5. **Work on the task** — (external to Mission Control)
6. **Complete the task** — mark as done
7. **Re-pick** — if completed within the re-pick window, pick up another task

---

## 1. Read Autonomy Config

Gideon reads the autonomy configuration from the `agent_state` table. The relevant fields are:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `auto_pickup_enabled` | boolean | `true` | Whether Gideon should auto-pick tasks |
| `max_concurrent_tasks` | integer | `1` | Max tasks Gideon can have in-progress simultaneously |
| `nightly_start_hour` | integer | `22` | Hour (0–23) when the nightly cycle starts |
| `repick_window_minutes` | integer | `120` | Minutes after cycle start within which re-pick is allowed |
| `due_date_urgency_hours` | integer | `48` | Tasks due within this many hours get priority boost |

These can be read directly from Supabase:

```bash
curl -s "${SUPABASE_URL}/rest/v1/agent_state?agent_id=eq.gideon&select=auto_pickup_enabled,max_concurrent_tasks,nightly_start_hour,repick_window_minutes,due_date_urgency_hours" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

---

## 2. Triage Ideas

### GET /api/agent/ideas

Returns all non-archived ideas for triage.

**Request:**
```bash
curl -s "${BASE_URL}/api/agent/ideas"
```

**Response:**
```json
{
  "ideas": [
    {
      "id": "uuid",
      "content": "Add dark mode toggle",
      "createdAt": 1738900000000,
      "archived": false,
      "convertedToTaskId": null,
      "archivedAt": null
    }
  ]
}
```

### POST /api/agent/ideas/triage

Perform a triage action on an idea.

**Archive an idea:**
```bash
curl -s -X POST "${BASE_URL}/api/agent/ideas/triage" \
  -H "Content-Type: application/json" \
  -d '{"idea_id": "uuid", "action": "archive"}'
```

**Response:**
```json
{
  "ok": true,
  "idea": { "id": "uuid", "content": "...", "archived": true, "archivedAt": 1738900000000 }
}
```

**Convert an idea to a task:**
```bash
curl -s -X POST "${BASE_URL}/api/agent/ideas/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "idea_id": "uuid",
    "action": "convert",
    "task_title": "Implement dark mode toggle",
    "task_description": "Add a toggle in settings to switch between light and dark themes",
    "task_priority": "medium"
  }'
```

**Response:**
```json
{
  "ok": true,
  "idea": { "id": "uuid", "archived": true, "convertedToTaskId": "task-uuid" },
  "task": { "id": "task-uuid", "title": "Implement dark mode toggle", "column": "todo", "priority": "medium" }
}
```

**Fields:**
- `idea_id` (required): UUID of the idea
- `action` (required): `"archive"` or `"convert"`
- `task_title` (required for convert): Title for the new task
- `task_description` (optional): Description for the new task
- `task_priority` (optional, default `"medium"`): `"low"` | `"medium"` | `"high"` | `"urgent"`

---

## 3. Pick Up a Task

### GET /api/agent/pickup

Returns the next eligible task based on the pickup criteria.

**Request:**
```bash
curl -s "${BASE_URL}/api/agent/pickup"
```

**Pickup criteria (in order):**
1. `column_status = 'todo'` AND (`assignee IS NULL` OR `assignee = 'gideon'`)
2. Tasks with due dates within `due_date_urgency_hours` are prioritised first (earliest due date wins)
3. Then sorted by priority: urgent > high > medium > low
4. Then by `created_at ASC` (oldest first)

**Successful response (task available):**
```json
{
  "task": {
    "id": "uuid",
    "title": "Implement login flow",
    "column": "todo",
    "priority": "high",
    "assignee": null,
    "dueDate": 1738986400000,
    "createdAt": 1738900000000,
    "updatedAt": 1738900000000
  }
}
```

**No task available:**
```json
{ "task": null, "reason": "no_eligible_tasks" }
```

**Possible reasons for no task:**
- `"auto_pickup_disabled"` — auto-pickup is turned off in settings
- `"max_concurrent_reached"` — Gideon already has the max number of in-progress tasks
- `"no_eligible_tasks"` — no tasks match the pickup criteria

---

## 4. Self-Assign a Task

### POST /api/agent/assign

Claims a task and moves it to in-progress. Also sets agent status to `active`.

**Request:**
```bash
curl -s -X POST "${BASE_URL}/api/agent/assign" \
  -H "Content-Type: application/json" \
  -d '{"task_id": "uuid"}'
```

**Response:**
```json
{
  "ok": true,
  "task": {
    "id": "uuid",
    "title": "Implement login flow",
    "column": "in-progress",
    "assignee": "gideon"
  }
}
```

---

## 5. Complete a Task

### POST /api/agent/complete

Marks a task as done and sets agent status to `idle`.

**Request:**
```bash
curl -s -X POST "${BASE_URL}/api/agent/complete" \
  -H "Content-Type: application/json" \
  -d '{"task_id": "uuid"}'
```

**Response:**
```json
{
  "ok": true,
  "task": {
    "id": "uuid",
    "title": "Implement login flow",
    "column": "done"
  }
}
```

---

## 6. Re-Pick Logic

After completing a task, Gideon should check whether re-picking is allowed:

```
cycle_start = nightly_start_hour (from autonomy config)
now = current time
repick_window = repick_window_minutes (from autonomy config)

if (now - cycle_start) < repick_window:
    call GET /api/agent/pickup
    if task returned:
        call POST /api/agent/assign
        work on task
        call POST /api/agent/complete
        repeat re-pick check
```

The re-pick window prevents Gideon from working indefinitely. Once the window expires, Gideon should stop picking up new tasks and rest until the next cycle.

---

## Nightly Cycle Pseudocode

```
function nightlyCycle():
    config = readAutonomyConfig()
    if not config.auto_pickup_enabled:
        log("Auto-pickup disabled, skipping cycle")
        return

    cycle_start = now()

    # Phase 1: Triage ideas
    ideas = GET /api/agent/ideas
    for idea in ideas:
        decision = evaluateIdea(idea)
        if decision == "archive":
            POST /api/agent/ideas/triage { idea_id, action: "archive" }
        elif decision == "convert":
            POST /api/agent/ideas/triage { idea_id, action: "convert", task_title, ... }

    # Phase 2: Task pickup loop
    while (now() - cycle_start) < config.repick_window_minutes * 60:
        pickup = GET /api/agent/pickup
        if pickup.task is null:
            log("No eligible tasks: " + pickup.reason)
            break

        POST /api/agent/assign { task_id: pickup.task.id }
        workOnTask(pickup.task)
        POST /api/agent/complete { task_id: pickup.task.id }

    log("Nightly cycle complete")
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "code": "bad_request" | "internal_error",
  "message": "Human-readable error description",
  "details": "Optional technical details"
}
```

**Recommended error handling:**
- **4xx errors:** Log and skip (bad input, task not found)
- **5xx errors:** Retry once after 30s, then log and skip
- **Network errors:** Retry up to 3 times with exponential backoff (5s, 15s, 45s)

---

## Activity Log

All agent actions are automatically logged to the `activity_log` table with `actor = 'gideon'`. Actions logged:

| Action | When |
|--------|------|
| `task_assigned` | Gideon self-assigns a task |
| `task_completed` | Gideon marks a task as done |
| `task_created` | Gideon converts an idea to a task |
| `idea_archived` | Gideon archives an idea during triage |
| `idea_converted` | Gideon converts an idea to a task |

These appear in the Mission Control activity feed in real-time.
