# Mission Control Phase 2 — Integration Briefing

**Date:** 6 February 2026
**Project:** Gideon Mission Control
**Owner:** Steve (Digital Technology Partner Ltd)
**Agent:** Gideon (OpenClaw v2026.2.2-3)
**Status:** Phase 1 Complete (UI shell), Phase 2 Ready

---

## 1. Executive Summary

Phase 1 delivered a functional Next.js PWA dashboard with a Kanban board, ideas backlog, chat panel, status indicator, and model selector — all persisted to localStorage with mock/local-only agent integration.

**Phase 2 migrates Mission Control from a local-only UI into a shared operational hub** where both Steve (via browser) and Gideon (via CLI/HTTP) have full CRUD access to tasks, ideas, and agent configuration. The three pillars of this phase are:

1. **Shared persistence via Supabase** — replacing localStorage with a real-time database both the UI and Gideon can read/write
2. **Real-time agent status** — a live indicator showing Gideon's actual state, polled/subscribed from a shared status record
3. **Backend model toggle** — direct model switching that doesn't depend on Gideon being responsive (critical for token-exhaustion recovery)

---

## 2. Current State Assessment

### 2.1 What Exists (Phase 1)

| Component | Status | Notes |
|-----------|--------|-------|
| **Next.js 16 App Router** | ✅ Working | TypeScript, Tailwind v4, shadcn/ui |
| **Kanban Board** | ✅ Working | 5 columns, drag-drop via @dnd-kit, board + list views, filters |
| **Ideas Backlog** | ✅ Working | Add, delete, drag-to-convert to task |
| **Chat Panel** | ✅ Working | Collapsible, bridges to OpenClaw canonical session via `sessions_send` tool |
| **Status Indicator** | ⚠️ Partial | Client-side only — set during chat, not from real agent state |
| **Model Selector** | ⚠️ Partial | Discovers models via gateway `/v1/models`, swaps via chat instruction (fragile) |
| **PWA** | ⚠️ Partial | Manifest exists, service worker configured, icons placeholder |
| **Persistence** | ❌ localStorage only | Not accessible to Gideon; single-browser, no sync |
| **Deployment** | Local only | `next dev` on iMac; appropriate for security |

### 2.2 Key Files & Architecture

```
app/
├── api/
│   ├── chat/route.ts          # Direct OpenAI-compat proxy to gateway
│   ├── chat-bridge/route.ts   # Canonical session bridge (polls for response)
│   ├── model/route.ts         # Model swap via chat instruction
│   ├── models/route.ts        # Model list from gateway /v1/models
│   └── status/route.ts        # Connectivity check via gateway /v1/models
├── page.tsx                   # Main page: DndContext + Kanban + Ideas
└── layout.tsx                 # Providers: Theme > Agent > Chat > Task

contexts/
├── agent-context.tsx          # Status, model, connectivity (polls every 15s)
├── chat-context.tsx           # Messages, streaming state
└── task-context.tsx           # Tasks + Ideas, localStorage persistence

lib/
├── api/agent.ts               # Client-side: fetchStatus, fetchModels, requestModelSwap
├── api/chat.ts                # Client-side: sendMessage via chat-bridge
├── api/errors.ts              # Shared error response helpers
├── gateway/client.ts          # Server-side: gatewayFetch with auth + timeout
├── gateway/tools.ts           # Server-side: gatewayToolInvoke (sessions, tools)
└── storage/tasks.ts           # localStorage load/save for tasks + ideas

types/index.ts                 # AgentStatus, Task, Idea, Message, etc.
```

### 2.3 Environment & Infrastructure

| Item | Value |
|------|-------|
| **Gateway** | OpenClaw, `127.0.0.1:18789`, LaunchAgent `ai.openclaw.gateway` |
| **Active model** | `anthropic/claude-haiku-4-5-20251001` |
| **Config dir** | `~/.openclaw/` |
| **Workspace** | `/Users/gideon/clawd/` |
| **Env vars (current)** | `CLAWDBOT_GATEWAY_URL`, `CLAWDBOT_GATEWAY_TOKEN`, `CLAWDBOT_CANONICAL_SESSION_KEY`, `CLAWDBOT_TELEGRAM_ECHO_TARGET` |
| **Telegram** | @gideonclawdbot — primary chat interface |

### 2.4 Naming: OpenClaw (not ClawdBot)

The system has been migrated from ClawdBot to **OpenClaw**. All new code, docs, and env vars should reference OpenClaw. However:

> **Critical constraint:** We must NOT modify OpenClaw's own source code. We need to remain compatible with `openclaw` updates via npm. All customisation must live in Mission Control, env vars, or external configuration.

The existing `CLAWDBOT_*` env vars still work at the gateway level. We will introduce new `OPENCLAW_*` aliases in Mission Control's env handling while maintaining backward compatibility.

---

## 3. Phase 2 Scope

### 3.1 Must-Have (This Phase)

| ID | Feature | Description |
|----|---------|-------------|
| **P2-1** | **Supabase backend** | Replace localStorage with Supabase Postgres + Realtime for tasks, ideas, and agent state |
| **P2-2** | **Gideon CRUD access** | Gideon can create, read, update, delete tasks and ideas via Supabase (CLI or HTTP) |
| **P2-3** | **Real-time status indicator** | Agent status stored in Supabase, updated by Gideon, subscribed to by the UI via Supabase Realtime |
| **P2-4** | **Backend model toggle** | Direct model switching via gateway API or `openclaw models set` — not dependent on agent being responsive |
| **P2-5** | **Streaming chat (Telegram-like UX)** | Real-time streamed responses in the chat panel, matching the Telegram interaction experience |
| **P2-6** | **UI polish** | Professional-grade UI matching Asana/Monday/ClickUp quality, Obsidian/Linear aesthetic |

### 3.2 Future Phases (Out of Scope)

| Phase | Features |
|-------|----------|
| **Phase 3** | Gideon autonomous task pickup (cron/scheduled), idea management by Gideon, activity log/audit trail |
| **Phase 4** | Cloud deployment (Netlify/Vercel + tunnel), multi-device access, mobile refinements |
| **Phase 5** | Multi-user auth, team collaboration, notification system, voice I/O |

---

## 4. Technical Design

### 4.1 Supabase Schema

A Supabase project will serve as the shared persistence layer. Both the Mission Control UI and Gideon (via Supabase client library or REST API) read/write the same tables.

#### Tables

```sql
-- Agent state: single-row table tracking Gideon's current status
CREATE TABLE agent_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL DEFAULT 'gideon' UNIQUE,
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'thinking', 'active', 'resting')),
  current_model TEXT NOT NULL DEFAULT 'default',
  model_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_heartbeat TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks on the Kanban board
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  column_status TEXT NOT NULL DEFAULT 'backlog'
    CHECK (column_status IN ('backlog', 'todo', 'in-progress', 'review', 'done')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee TEXT,
  due_date TIMESTAMPTZ,
  labels JSONB DEFAULT '[]'::jsonb,
  created_by TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ideas backlog
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  archived BOOLEAN DEFAULT false,
  converted_to_task_id UUID REFERENCES tasks(id),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages (optional persistence — enables history across sessions)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  session_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Row-Level Security (RLS)

For this phase (local-only, single user), RLS can be permissive. We'll use a **service role key** server-side (Next.js API routes) and the **anon key** for Supabase Realtime subscriptions on the client. Both keys stay in `.env.local` and are never exposed to the browser directly except the anon key for Realtime.

#### Realtime

Enable Supabase Realtime on:
- `agent_state` — UI subscribes to status/model changes
- `tasks` — UI subscribes to inserts/updates/deletes (for when Gideon modifies tasks)
- `ideas` — UI subscribes to changes

This means when Gideon updates a task status from his CLI, the Kanban board updates **instantly** in the browser without polling.

### 4.2 Gideon's Access Pattern

Gideon accesses Supabase via one of:

1. **Supabase JS client** — if running in a Node context, he can use `@supabase/supabase-js`
2. **Supabase REST API** — direct HTTP calls to `https://<project>.supabase.co/rest/v1/tasks` with the service role key
3. **OpenClaw tools** — if we define custom tools that wrap Supabase operations (future phase)

For Phase 2, the simplest approach is **option 2 (REST API)** because:
- Gideon has full web access and CLI capabilities
- No additional npm dependencies in his runtime
- Works with `curl` or any HTTP client
- The service role key is stored in his environment

**Example: Gideon moves a task to "in-progress"**
```bash
curl -X PATCH "https://<project>.supabase.co/rest/v1/tasks?id=eq.<task-id>" \
  -H "apikey: <service_role_key>" \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"column_status": "in-progress", "assignee": "gideon", "updated_at": "now()"}'
```

**Example: Gideon creates a new task**
```bash
curl -X POST "https://<project>.supabase.co/rest/v1/tasks" \
  -H "apikey: <service_role_key>" \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Implement login flow", "column_status": "todo", "assignee": "gideon", "priority": "high"}'
```

### 4.3 Real-Time Agent Status

**Architecture:**

```
┌─────────────┐     writes status     ┌──────────────┐
│   Gideon    │ ────────────────────►  │   Supabase   │
│  (OpenClaw) │                        │  agent_state  │
└─────────────┘                        └──────┬───────┘
                                              │ Realtime subscription
                                              ▼
                                       ┌──────────────┐
                                       │  Mission     │
                                       │  Control UI  │
                                       └──────────────┘
```

**How Gideon updates his status:**
- Gideon is instructed (via his memory/system prompt) to update the `agent_state` table when his state changes
- He calls the Supabase REST API with `PATCH /rest/v1/agent_state?agent_id=eq.gideon`
- He updates `status`, `current_model`, and `last_heartbeat`

**How the UI consumes it:**
- `AgentContext` subscribes to Supabase Realtime on the `agent_state` table
- On any change, the status indicator, model name, and connection state update instantly
- A **heartbeat timeout** (e.g. no heartbeat in 60s → show "disconnected") provides a dead-man switch

**Heartbeat approach:**
- Gideon updates `last_heartbeat` periodically (every 30s when active, every 60s when idle)
- This can be set up as part of his instructions or as a lightweight cron
- If heartbeat is stale, the UI shows "disconnected" regardless of the `status` field

### 4.4 Backend Model Toggle

**Problem:** If Gideon exhausts tokens on a model provider, he can't respond to a chat instruction to switch models. The user needs a direct backend mechanism.

**Solution:** Two-path model switching:

#### Path A: Via OpenClaw CLI (server-side)
```bash
openclaw models set anthropic/claude-sonnet-4-20250514
```
Mission Control's API route shells out to this command. This is the **reliable fallback** that works even when Gideon is unresponsive.

#### Path B: Via Gateway API (server-side)
The current `/api/model/route.ts` sends a chat instruction — this is fragile. Replace with:

1. **Primary:** Call `openclaw models set <model>` via a server-side `exec()` in a new API route
2. **Update Supabase:** After a successful swap, update `agent_state.current_model`
3. **UI reflects change** instantly via Realtime subscription

```
POST /api/model-switch
Body: { "model": "anthropic/claude-sonnet-4-20250514" }

Server-side:
1. exec("openclaw models set <model>")
2. supabase.from('agent_state').update({ current_model: model })
3. Return success/failure
```

**Important:** This bypasses the agent entirely. It's a direct backend operation, ensuring the user always has control even during token exhaustion or agent crashes.

### 4.5 Streaming Chat (Telegram-Like UX)

**Goal:** The chat panel should feel like the Telegram experience — real-time, streamed, responsive.

**Current state:** The `chat-bridge` route uses tool invocations (`sessions_send` → poll `sessions_history`), which is non-streaming and has up to 30s polling latency.

**Target architecture:**

```
┌─────────────┐   POST /api/chat    ┌──────────────┐   SSE stream    ┌──────────────┐
│  Chat Input │ ──────────────────►  │  Next.js API │ ─────────────►  │   OpenClaw   │
│  (Browser)  │ ◄────────────────── │  /api/chat   │ ◄───────────── │   Gateway    │
│             │   streamed tokens    │              │   SSE stream    │  :18789      │
└─────────────┘                      └──────────────┘                 └──────────────┘
```

**Implementation:**
1. Use the **existing `/api/chat/route.ts`** which already supports SSE passthrough
2. Refactor the client-side `sendMessage()` in `lib/api/chat.ts` to consume the SSE stream directly (currently it uses the bridge polling approach)
3. Parse SSE `data:` lines in the browser, appending tokens to the assistant message in real-time
4. Show typing indicator while streaming, auto-scroll, etc.

**The bridge route (`/api/chat-bridge`) remains** as a fallback for non-streaming tool interactions but the primary chat UX switches to the direct SSE path.

### 4.6 UI Polish

**Target:** Professional-grade project management tool matching Asana/Monday.com/ClickUp quality with Obsidian/Linear aesthetic.

#### Key Improvements Needed

| Area | Current State | Target |
|------|---------------|--------|
| **Kanban cards** | Minimal cards with basic info | Rich cards: avatar badges, priority chips, due date pills, label dots, progress indicators |
| **Column headers** | Plain text + count | Styled headers with task count badges, column color accents, "+" quick-add |
| **Board chrome** | Basic flex layout | Polished with column separators, smooth drag animations, drop zone highlighting |
| **Ideas panel** | Functional but sparse | Refined with better empty states, drag handles, category tags |
| **Chat panel** | Basic bubbles | Markdown rendering, code blocks, typing animation, timestamp grouping |
| **Header** | Placeholder elements | Functional: real search, notification center (future), workspace switcher |
| **Status indicator** | Emoji + dot | Polished badge with animated ring, tooltip with details, subtle transitions |
| **Typography** | System defaults | Refined spacing, consistent type scale, proper hierarchy |
| **Animations** | Minimal | Smooth transitions, spring-based drag, fade/slide for panels |
| **Empty states** | Basic text | Illustrated empty states with helpful CTAs |
| **Loading states** | None/basic | Skeleton loaders, shimmer effects |

#### Design Tokens (Obsidian/Linear Palette)

Maintain the existing neutral palette but refine:
- **Background layers:** `bg-background` → `bg-muted/30` → `bg-card` (clear depth)
- **Accent usage:** Sparing — primary blue for CTAs, status colors for indicators only
- **Border style:** `border-border/40` for subtle separation, no heavy borders
- **Shadow system:** Minimal — `shadow-sm` for cards, `shadow-lg` for modals/overlays
- **Motion:** `duration-200` for micro-interactions, `duration-300` for panels, spring physics for drag

---

## 5. Implementation Plan

### 5.1 Work Breakdown

#### Epic 1: Supabase Integration (P2-1, P2-2)

| Task | Description | Priority |
|------|-------------|----------|
| 1.1 | Create Supabase project and configure tables, RLS, Realtime | High |
| 1.2 | Add `@supabase/supabase-js` to Mission Control dependencies | High |
| 1.3 | Create `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (service role) | High |
| 1.4 | Migrate `TaskContext` from localStorage to Supabase (CRUD operations) | High |
| 1.5 | Migrate ideas persistence to Supabase | High |
| 1.6 | Add Supabase Realtime subscriptions for tasks and ideas | High |
| 1.7 | Write data migration utility: localStorage → Supabase (one-time) | Medium |
| 1.8 | Add `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | High |
| 1.9 | Document Gideon's REST API access patterns (curl examples) | High |
| 1.10 | Test: Gideon creates a task via REST, UI updates in real-time | High |

#### Epic 2: Real-Time Agent Status (P2-3)

| Task | Description | Priority |
|------|-------------|----------|
| 2.1 | Create `agent_state` table in Supabase | High |
| 2.2 | Seed initial row for agent_id='gideon' | High |
| 2.3 | Refactor `AgentContext` to subscribe to `agent_state` via Realtime | High |
| 2.4 | Implement heartbeat timeout logic (stale → disconnected) | High |
| 2.5 | Create instructions for Gideon: how to update his status via REST | High |
| 2.6 | Test: Gideon updates status → UI reflects within 1 second | High |

#### Epic 3: Backend Model Toggle (P2-4)

| Task | Description | Priority |
|------|-------------|----------|
| 3.1 | Create `POST /api/model-switch` route that calls `openclaw models set` server-side | High |
| 3.2 | Update ModelSelector component to call new endpoint | High |
| 3.3 | After successful switch, update `agent_state.current_model` in Supabase | High |
| 3.4 | Refactor `/api/models` to also read the model list from `agent_state.model_list` as a supplementary source | Medium |
| 3.5 | Add error handling + toast for switch failures | High |
| 3.6 | Test: switch model while agent is unresponsive → model changes successfully | High |

#### Epic 4: Streaming Chat (P2-5)

| Task | Description | Priority |
|------|-------------|----------|
| 4.1 | Refactor `lib/api/chat.ts` to consume SSE stream from `/api/chat` instead of bridge polling | High |
| 4.2 | Implement SSE parser: handle `data:` lines, `[DONE]` signal, error events | High |
| 4.3 | Update `ChatContext` to support incremental token appending during stream | High |
| 4.4 | Add typing indicator animation while streaming | Medium |
| 4.5 | Add auto-scroll behavior during streaming | Medium |
| 4.6 | Persist chat messages to Supabase `messages` table (full history like Telegram) | High |
| 4.7 | Chat history UI: scrollable history, date grouping, timestamps, markdown rendering, "clear conversation" button | High |
| 4.8 | Load previous messages from Supabase on mount (paginated, newest first) | High |
| 4.9 | Test: send message → tokens stream in real-time, full response renders; reload → history preserved | High |

#### Epic 5: UI Polish (P2-6)

| Task | Description | Priority |
|------|-------------|----------|
| 5.1 | Redesign task cards: rich layout with priority, assignee avatar, due date, labels | High |
| 5.2 | Redesign column headers with color accents and task counts | High |
| 5.3 | Add drag animation improvements (spring physics, ghost card, drop zone highlights) | Medium |
| 5.4 | Polish chat panel: markdown rendering, code blocks, message grouping | High |
| 5.5 | Polish status indicator: refined animation, tooltip, connected/disconnected states | Medium |
| 5.6 | Add skeleton loaders for initial data fetch | Medium |
| 5.7 | Improve empty states with illustrations and CTAs | Medium |
| 5.8 | Responsive refinements for tablet/mobile | Low |
| 5.9 | Accessibility pass: keyboard nav, ARIA labels, focus management | Medium |
| 5.10 | Typography and spacing audit against Linear/Obsidian reference | Medium |

### 5.2 Suggested Execution Order

```
Week 1: Foundation
├── Epic 1 (1.1–1.8): Supabase setup + migration
├── Epic 2 (2.1–2.3): Agent state table + Realtime subscription
└── Epic 3 (3.1–3.3): Backend model switch

Week 2: Live Integration
├── Epic 1 (1.9–1.10): Gideon access docs + testing
├── Epic 2 (2.4–2.6): Heartbeat + Gideon instructions + testing
├── Epic 3 (3.4–3.6): Refinement + testing
└── Epic 4 (4.1–4.4): Streaming chat

Week 3: Polish
├── Epic 4 (4.5–4.7): Chat polish + persistence
├── Epic 5 (5.1–5.6): UI overhaul
└── Epic 5 (5.7–5.10): Final polish + testing
```

---

## 6. Environment Variables

### New Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# OpenClaw (aliases — gateway still reads CLAWDBOT_* internally)
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=<token>
OPENCLAW_CANONICAL_SESSION_KEY=agent:main:main
OPENCLAW_TELEGRAM_ECHO_TARGET=<telegram-target>
```

### Backward Compatibility

The gateway client (`lib/gateway/client.ts`) will be updated to check `OPENCLAW_*` vars first, falling back to `CLAWDBOT_*`:

```typescript
const url = process.env.OPENCLAW_GATEWAY_URL || process.env.CLAWDBOT_GATEWAY_URL || 'http://127.0.0.1:18789';
const token = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.CLAWDBOT_GATEWAY_TOKEN || '';
```

---

## 7. Security Considerations

### 7.1 Local-Only Deployment (This Phase)

Running Mission Control locally is the correct choice for now:
- The OpenClaw gateway binds to `127.0.0.1` — not accessible externally
- Supabase service role key stays server-side (never in browser)
- No auth needed (single user, local machine)
- Gideon can reach Supabase directly (he has web access)

### 7.2 Supabase Security

- **Anon key** (public): Used by the browser for Realtime subscriptions only; RLS policies restrict access
- **Service role key** (secret): Used by Next.js API routes and by Gideon for full CRUD; stored in `.env.local` and Gideon's environment
- **RLS policy**: For Phase 2, a permissive policy (`USING (true)`) is acceptable since we're single-user. Tighten in Phase 5 when multi-user is added.

### 7.3 Risks

| Risk | Mitigation |
|------|------------|
| Supabase key exposed in browser | Only anon key in `NEXT_PUBLIC_*`; service key server-only |
| Gideon writes bad data | Schema constraints (CHECK, NOT NULL) + validation in API routes |
| Supabase downtime | Graceful degradation: show "offline" state, queue writes (future) |
| OpenClaw update breaks API | We don't modify OpenClaw; we wrap its CLI/API with our own routes |

---

## 8. Constraints & Non-Negotiables

1. **Do NOT modify OpenClaw source code.** All customisation via Mission Control code, env vars, or external config. OpenClaw must remain upgradeable via `npm update`.

2. **OpenClaw naming going forward.** All new code, docs, UI copy, and env var names use "OpenClaw" — not "ClawdBot". Existing `CLAWDBOT_*` env vars are supported for backward compat only.

3. **Local deployment only (Phase 2).** No public endpoints, no tunnels, no cloud hosting for the dashboard itself. Supabase is cloud-hosted (that's fine — it's a managed DB).

4. **Agent status types are fixed:** `idle | thinking | active | resting`. No new statuses this phase.

5. **Gideon manages his own concurrency** for task pickup. No guardrails needed from Mission Control.

---

## 9. Acceptance Criteria

| ID | Criterion | Test |
|----|-----------|------|
| AC-1 | Tasks persist across browser reload via Supabase | Create task → reload → task still visible |
| AC-2 | Gideon creates a task via REST → it appears on the Kanban board within 2s | curl POST → UI updates |
| AC-3 | Gideon moves a task to "done" → board updates in real-time | curl PATCH → column change visible |
| AC-4 | Agent status updates in < 1s when Gideon writes to `agent_state` | PATCH status → indicator changes |
| AC-5 | Heartbeat timeout shows "disconnected" after 60s of no heartbeat | Stop heartbeat → UI shows disconnected |
| AC-6 | Model switch works when agent is unresponsive | Kill agent → switch model via UI → success |
| AC-7 | Chat streams tokens in real-time (SSE) | Send message → tokens appear incrementally |
| AC-8 | UI matches professional project tool quality | Visual review against Asana/Linear reference |
| AC-9 | `next build` succeeds with no TypeScript errors | `npm run build` passes |
| AC-10 | All existing tests continue to pass | `npm test` passes |

---

## 10. Definition of Done (Phase 2)

- [ ] Supabase tables created with schema as specified
- [ ] All task/idea CRUD operations use Supabase (localStorage removed)
- [ ] Supabase Realtime subscriptions active for tasks, ideas, agent_state
- [ ] Gideon can CRUD tasks via Supabase REST API
- [ ] Agent status indicator reflects real-time state from Supabase
- [ ] Heartbeat timeout displays "disconnected" correctly
- [ ] Model toggle works via backend (not reliant on agent)
- [ ] Chat streams via SSE (Telegram-like UX)
- [ ] UI polished to professional standard
- [ ] All acceptance criteria pass
- [ ] `eslint`, `tsc --noEmit`, and `next build` pass cleanly
- [ ] Documentation updated for Gideon's access patterns

---

## 11. Resolved Questions

1. **Supabase project:** ✅ **New project** — create a fresh Supabase project for Mission Control.
2. **Gideon's env:** ✅ **`/Users/gideon/.openclaw/.env`** — Supabase keys (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) stored alongside existing OpenClaw env vars.
3. **Chat history:** ✅ **Persist like Telegram** — chat messages persist across sessions via the `messages` table. The UI should provide a seamless conversation history (scrollable, searchable, grouped by date) with a "clear conversation" option. Optimal UX: message grouping, timestamps, read markers, markdown rendering.
4. **Heartbeat mechanism:** ✅ **Existing cron in Gideon** — Gideon already has a cron-based heartbeat. Mission Control will consume the `last_heartbeat` field from `agent_state` and apply the dead-man switch timeout (60s stale → disconnected).

---

## 12. Appendix: Reference Material

| Document | Location |
|----------|----------|
| Phase 1 PRD | `docs/PRD_clawdbot_gideon_mission_control_dashboard_2026-01-31.md` |
| Phase 1 Implementation Tasks | `docs/Implementation_Tasks_2026-01-31.md` |
| OpenClaw Handover | `docs/clawdbot clean up project/CLAWDBOT_HANDOVER_2026-02-01.md` |
| Workspace Rules v1.3 | `docs/clawdbot clean up project/CLAWDBOT_WORKSPACE_RULES_v1.3.md` |
| Gideon Setup Summary | `/Users/gideon/clawd/docs/GIDEON-SETUP-SUMMARY.md` |

---

*Briefing prepared 6 February 2026. Ready for review and implementation approval.*
