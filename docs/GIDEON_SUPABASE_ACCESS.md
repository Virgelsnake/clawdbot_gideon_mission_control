# Gideon — Supabase REST API Access Guide

**Project:** Mission Control (Phase 2)
**Supabase Project:** `uzrkdojntoljwmncfxrt` (region: eu-west-2)
**Created:** 6 February 2026

---

## 1. Environment Setup

Gideon needs two environment variables stored in `/Users/gideon/.openclaw/.env`:

```env
SUPABASE_URL=https://uzrkdojntoljwmncfxrt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

The **service role key** bypasses RLS and grants full CRUD access to all tables. It must never be exposed publicly.

For convenience in shell scripts, export them:

```bash
export SUPABASE_URL="https://uzrkdojntoljwmncfxrt.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

All curl examples below use `$SUPABASE_URL` and `$SUPABASE_SERVICE_ROLE_KEY` as placeholders.

---

## 2. Common Headers

Every request to the Supabase REST API requires these headers:

```
apikey: $SUPABASE_SERVICE_ROLE_KEY
Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY
Content-Type: application/json
```

For requests that should return the created/updated row, add:

```
Prefer: return=representation
```

---

## 3. Schema Reference

### 3.1 `tasks` Table

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | uuid | `gen_random_uuid()` | PRIMARY KEY |
| `title` | text | — | NOT NULL |
| `description` | text | NULL | nullable |
| `column_status` | text | `'backlog'` | CHECK: `backlog`, `todo`, `in-progress`, `review`, `done` |
| `priority` | text | NULL | CHECK: `low`, `medium`, `high`, `urgent` |
| `assignee` | text | NULL | nullable |
| `due_date` | timestamptz | NULL | nullable |
| `labels` | jsonb | `'[]'` | nullable |
| `created_by` | text | `'user'` | nullable |
| `created_at` | timestamptz | `now()` | nullable |
| `updated_at` | timestamptz | `now()` | nullable |

### 3.2 `ideas` Table

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | uuid | `gen_random_uuid()` | PRIMARY KEY |
| `content` | text | — | NOT NULL |
| `archived` | boolean | `false` | nullable |
| `converted_to_task_id` | uuid | NULL | FK → `tasks.id` |
| `archived_at` | timestamptz | NULL | nullable |
| `created_at` | timestamptz | `now()` | nullable |

### 3.3 `agent_state` Table

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | uuid | `gen_random_uuid()` | PRIMARY KEY |
| `agent_id` | text | `'gideon'` | UNIQUE, NOT NULL |
| `status` | text | `'idle'` | CHECK: `idle`, `thinking`, `active`, `resting` |
| `current_model` | text | `'default'` | NOT NULL |
| `model_list` | jsonb | `'[]'` | NOT NULL |
| `last_heartbeat` | timestamptz | `now()` | nullable |
| `updated_at` | timestamptz | `now()` | nullable |

### 3.4 `messages` Table

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| `id` | uuid | `gen_random_uuid()` | PRIMARY KEY |
| `role` | text | — | CHECK: `user`, `assistant`, `system` |
| `content` | text | — | NOT NULL |
| `session_id` | text | `'default'` | nullable |
| `created_at` | timestamptz | `now()` | nullable |

---

## 4. Task Operations

### 4.1 Create a Task

```bash
curl -s -X POST "$SUPABASE_URL/rest/v1/tasks" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "title": "Implement login flow",
    "column_status": "todo",
    "priority": "high",
    "assignee": "gideon",
    "created_by": "gideon"
  }'
```

**Required fields:** `title`
**Optional fields:** `description`, `column_status` (defaults to `backlog`), `priority`, `assignee`, `due_date`, `labels`, `created_by` (defaults to `user`)

### 4.2 List All Tasks

```bash
curl -s "$SUPABASE_URL/rest/v1/tasks?select=*&order=created_at.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### 4.3 List Tasks with Filters

**By column:**
```bash
curl -s "$SUPABASE_URL/rest/v1/tasks?column_status=eq.todo&order=created_at.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**By assignee:**
```bash
curl -s "$SUPABASE_URL/rest/v1/tasks?assignee=eq.gideon&order=created_at.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**By priority:**
```bash
curl -s "$SUPABASE_URL/rest/v1/tasks?priority=eq.high&order=created_at.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**Multiple filters (AND):**
```bash
curl -s "$SUPABASE_URL/rest/v1/tasks?column_status=eq.in-progress&assignee=eq.gideon" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**Not-done tasks:**
```bash
curl -s "$SUPABASE_URL/rest/v1/tasks?column_status=neq.done&order=created_at.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### 4.4 Get a Single Task

```bash
curl -s "$SUPABASE_URL/rest/v1/tasks?id=eq.<task-uuid>&select=*" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### 4.5 Update Task Status (Move Column)

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/tasks?id=eq.<task-uuid>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "column_status": "in-progress",
    "updated_at": "now()"
  }'
```

**Valid `column_status` values:** `backlog`, `todo`, `in-progress`, `review`, `done`

### 4.6 Update Task Fields

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/tasks?id=eq.<task-uuid>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "priority": "urgent",
    "assignee": "gideon",
    "description": "Updated description",
    "updated_at": "now()"
  }'
```

### 4.7 Delete a Task

```bash
curl -s -X DELETE "$SUPABASE_URL/rest/v1/tasks?id=eq.<task-uuid>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

---

## 5. Idea Operations

### 5.1 Create an Idea

```bash
curl -s -X POST "$SUPABASE_URL/rest/v1/ideas" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "content": "Add dark mode toggle to settings"
  }'
```

### 5.2 List Ideas

```bash
curl -s "$SUPABASE_URL/rest/v1/ideas?archived=eq.false&order=created_at.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### 5.3 Archive an Idea

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/ideas?id=eq.<idea-uuid>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "archived": true,
    "archived_at": "now()"
  }'
```

### 5.4 Delete an Idea

```bash
curl -s -X DELETE "$SUPABASE_URL/rest/v1/ideas?id=eq.<idea-uuid>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

---

## 6. Agent State Operations

Gideon has a single row in `agent_state` with `agent_id='gideon'`. All updates target this row.

### 6.1 Update Agent Status

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_state?agent_id=eq.gideon" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "active",
    "updated_at": "now()"
  }'
```

**Valid `status` values:** `idle`, `thinking`, `active`, `resting`

### 6.2 Update Heartbeat

Call this periodically (every 30s when active, every 60s when idle) to signal liveness. If `last_heartbeat` is stale for >60s, the Mission Control UI will show "disconnected".

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_state?agent_id=eq.gideon" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "last_heartbeat": "now()",
    "updated_at": "now()"
  }'
```

### 6.3 Update Current Model

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_state?agent_id=eq.gideon" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "current_model": "anthropic/claude-sonnet-4-20250514",
    "updated_at": "now()"
  }'
```

### 6.4 Combined Status + Heartbeat Update

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_state?agent_id=eq.gideon" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "thinking",
    "last_heartbeat": "now()",
    "updated_at": "now()"
  }'
```

### 6.5 Read Current Agent State

```bash
curl -s "$SUPABASE_URL/rest/v1/agent_state?agent_id=eq.gideon&select=*" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

---

## 7. PostgREST Filter Reference

The Supabase REST API uses PostgREST operators for filtering:

| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` | Equals | `?column_status=eq.todo` |
| `neq` | Not equals | `?column_status=neq.done` |
| `gt` | Greater than | `?created_at=gt.2026-02-01` |
| `lt` | Less than | `?priority=lt.high` |
| `in` | In list | `?column_status=in.(todo,in-progress)` |
| `is` | Is (null/bool) | `?assignee=is.null` |
| `like` | LIKE pattern | `?title=like.*login*` |
| `ilike` | Case-insensitive LIKE | `?title=ilike.*login*` |
| `order` | Sort | `?order=created_at.desc` |
| `limit` | Limit rows | `?limit=10` |
| `offset` | Skip rows | `?offset=20` |

---

## 8. Real-Time Integration

When Gideon writes to `tasks`, `ideas`, or `agent_state`, the Mission Control UI receives the change **instantly** via Supabase Realtime subscriptions. No polling or notification is needed — just write to the table and the UI updates automatically.

### Workflow Example: Gideon Picks Up a Task

1. **Set status to "thinking"** (Section 6.1)
2. **Move task to "in-progress"** (Section 4.5)
3. **Update heartbeat periodically** (Section 6.2)
4. **When done, move task to "done"** (Section 4.5)
5. **Set status to "idle"** (Section 6.1)

All five steps trigger real-time UI updates on the Kanban board and status indicator.

---

## 9. Error Handling

### CHECK Constraint Violations

If you send an invalid value for a constrained field, Supabase returns HTTP 400:

```json
{
  "code": "23514",
  "details": null,
  "hint": null,
  "message": "new row for relation \"tasks\" violates check constraint \"tasks_column_status_check\""
}
```

**Valid values:**
- `column_status`: `backlog`, `todo`, `in-progress`, `review`, `done`
- `priority`: `low`, `medium`, `high`, `urgent`
- `status` (agent_state): `idle`, `thinking`, `active`, `resting`
- `role` (messages): `user`, `assistant`, `system`

### NOT NULL Violations

Missing required fields return HTTP 400:

```json
{
  "code": "23502",
  "details": "Failing row contains (null, ...).",
  "message": "null value in column \"title\" of relation \"tasks\" violates not-null constraint"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH, DELETE) |
| 201 | Created (POST) |
| 400 | Bad request (constraint violation, invalid JSON) |
| 401 | Unauthorized (bad or missing API key) |
| 404 | Not found (wrong URL) |
| 409 | Conflict (unique constraint violation) |
