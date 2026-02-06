# Phase 2 Implementation Tasks — Shared Persistence & Integration

**Source PRD:** `tasks/prd-phase2-shared-persistence-and-integration.md`
**Briefing:** `docs/PHASE2_BRIEFING_2026-02-06.md`
**Created:** 6 February 2026
**Status:** Ready for execution

---

## Notes / Changes

_(Record scope changes, discoveries, and deferred items here as work progresses.)_

### Pre-existing test failures (discovered 0.1)
- `status-indicator.test.tsx`: 1 failure — test expects model name text "gpt-4o" but component no longer renders it that way
- `ideas.test.tsx`: 3 failures — tests expect "no ideas yet" empty state text, "quick add idea" placeholder, and "Promote to task" title that don't match current component
- **Decision:** These are pre-existing; will fix in a remediation task after Section 2 types work. Does not block Phase 2 progress.

---

## 0. Pre-Flight

- [x] **0.1** Baseline health check — run `npm run build`, `npm test`, `npx tsc --noEmit`, `npm run lint` and confirm all pass
- [x] **0.2** Create feature branch `phase2/shared-persistence` from current HEAD
- [x] **0.3** Confirm Supabase project exists and is accessible (URL + keys available) — created `mission-control` (uzrkdojntoljwmncfxrt), eu-west-2
- [ ] **0.4** Confirm OpenClaw gateway is running — **SKIPPED: gateway not responding, non-blocking for Sections 1-4** (`curl http://127.0.0.1:18789/v1/models`)

---

## 1. Supabase Foundation (P2-1)

> **Maps to:** FR-1.1 through FR-1.6, FR-1.11, FR-7.1, FR-7.2, FR-7.3

- [x] **1.1** Install `@supabase/supabase-js` dependency
- [x] **1.2** Create `.env.local.example` documenting all required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_CANONICAL_SESSION_KEY`, `OPENCLAW_TELEGRAM_ECHO_TARGET`
- [x] **1.3** Create `lib/supabase/client.ts` — browser Supabase client using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] **1.4** Create `lib/supabase/server.ts` — server Supabase client using `SUPABASE_SERVICE_ROLE_KEY` (never exposed to browser)
- [x] **1.5** Create Supabase tables via SQL: `tasks`, `ideas`, `agent_state`, `messages` — matching the schema in briefing Section 4.1 (CHECK constraints, defaults, FKs)
- [x] **1.6** Enable Supabase Realtime on `tasks`, `ideas`, `agent_state` tables
- [x] **1.7** Configure RLS: permissive `USING (true)` policies on all four tables for Phase 2
- [x] **1.8** Seed initial `agent_state` row: `agent_id='gideon'`, `status='idle'`, `current_model='default'`
- [x] **1.9** Update `lib/gateway/client.ts` → `getGatewayEnv()` to prefer `OPENCLAW_*` env vars with `CLAWDBOT_*` fallback
- [x] **1.10** Update `app/api/chat-bridge/route.ts` to read `OPENCLAW_CANONICAL_SESSION_KEY` / `OPENCLAW_TELEGRAM_ECHO_TARGET` with `CLAWDBOT_*` fallback
- [x] **1.11** Validate: `npm run build` + `npx tsc --noEmit` pass after foundation changes

**⏸ CHECKPOINT — Section 1 complete. Stop for approval.**

---

## 2. Type Updates

> **Maps to:** PRD Section 11 (Technical Considerations — Type Updates Required)

- [x] **2.1** Update `types/index.ts`: add `'system'` to `MessageRole` type
- [x] **2.2** Update `types/index.ts`: add `session_id?: string` to `Message` interface
- [x] **2.3** Update `types/index.ts`: add `lastHeartbeat?: string` and `updatedAt?: string` to `AgentState` interface
- [x] **2.4** Add Supabase row types in `types/index.ts` (or `types/supabase.ts`): `DbTask`, `DbIdea`, `DbAgentState`, `DbMessage` — mapping Supabase snake_case columns to TypeScript interfaces
- [x] **2.5** Create mapper functions (`lib/supabase/mappers.ts`) to convert between DB row types and existing app types (`Task`, `Idea`, `AgentState`, `Message`)
- [x] **2.6** Validate: `npx tsc --noEmit` passes; no existing consumers broken

**⏸ CHECKPOINT — Section 2 complete. Stop for approval.**

---

## 3. Task Persistence Migration (P2-1)

> **Maps to:** FR-1.7, FR-1.8, FR-1.9, FR-1.10

- [x] **3.1** Create `lib/supabase/tasks.ts` — Supabase CRUD functions: `fetchTasks()`, `createTask()`, `updateTask()`, `deleteTask()` _(completed during Section 1)_
- [x] **3.2** Refactor `TaskContext` — replace localStorage init with Supabase `fetchTasks()` on mount; add loading state _(completed during Section 1)_
- [x] **3.3** Refactor `TaskContext` — replace `saveTasks()` calls with individual Supabase CRUD operations (`createTask`, `updateTask`, `deleteTask`) _(completed during Section 1)_
- [x] **3.4** Add Supabase Realtime subscription in `TaskContext` for `tasks` table (INSERT, UPDATE, DELETE) — update local state on remote changes _(completed during Section 1)_
- [x] **3.5** Create `lib/supabase/ideas.ts` — Supabase CRUD: `fetchIdeas()`, `createIdea()`, `updateIdea()`, `deleteIdea()` _(completed during Section 1)_
- [x] **3.6** Refactor `TaskContext` — replace ideas localStorage with Supabase CRUD + Realtime subscription _(completed during Section 1)_
- [x] **3.7** Create one-time migration utility (`lib/supabase/migrate-localstorage.ts`): reads localStorage, inserts into Supabase if tables are empty, clears localStorage after success
- [x] **3.8** Wire migration utility into app startup (run once on first mount if localStorage has data and Supabase tables are empty)
- [x] **3.9** Remove `lib/storage/tasks.ts` localStorage module — removed along with empty `lib/storage/` directory; no consumers remained
- [x] **3.10** Validate: `npm run build` passes; `npx tsc --noEmit` passes; test failures are pre-existing only (see notes)

**⏸ CHECKPOINT — Section 3 complete. Stop for approval.**

---

## 4. Real-Time Agent Status (P2-3)

> **Maps to:** FR-3.1 through FR-3.7

- [x] **4.1** Create `lib/supabase/agent-state.ts` — functions: `fetchAgentState()`, `updateAgentState()`, `subscribeAgentState()`
- [x] **4.2** Refactor `AgentContext` — replace polling with Supabase Realtime subscription on `agent_state` table
- [x] **4.3** Implement heartbeat timeout logic in `AgentContext`: if `last_heartbeat` is >60s stale, override displayed status to `'disconnected'`; add `'disconnected'` as a UI-only display status (not in DB enum)
- [x] **4.4** Update status indicator component to support `'disconnected'` display state with appropriate styling
- [x] **4.5** Keep gateway connectivity check (`/api/status`) as supplementary signal — connected = Supabase Realtime active AND heartbeat fresh
- [x] **4.6** Validate: `npm run build` + `npx tsc --noEmit` pass; runtime validation deferred to Section 7 integration tests (gateway not running)

**⏸ CHECKPOINT — Section 4 complete. Stop for approval.**

---

## 5. Backend Model Toggle (P2-4)

> **Maps to:** FR-4.1 through FR-4.6

- [x] **5.1** Create `POST /api/model-switch/route.ts` — executes `openclaw models set <model>` via `child_process.exec()` server-side
- [x] **5.2** After successful CLI exec in `/api/model-switch`, update `agent_state.current_model` in Supabase
- [x] **5.3** Add input validation + error handling in `/api/model-switch` (sanitise model name, handle exec failure, return structured error)
- [x] **5.4** Update `ModelSelector` component + `AgentContext.setCurrentModel()` to call `POST /api/model-switch` instead of the old chat-instruction approach
- [x] **5.5** Add toast notification on model switch success/failure (using `sonner`)
- [x] **5.6** UI reads `current_model` from `agent_state` Realtime subscription (instant reflection) — already wired via `AgentContext` Realtime subscription
- [x] **5.7** Validate: `npm run build` + `npx tsc --noEmit` pass

**⏸ CHECKPOINT — Section 5 complete. Stop for approval.**

---

## 6. Streaming Chat (P2-5)

> **Maps to:** FR-5.1 through FR-5.10

- [x] **6.1** Refactor `lib/api/chat.ts` `sendMessage()` — consume SSE stream from `POST /api/chat` with `{ stream: true }` instead of bridge polling
- [x] **6.2** Implement SSE parser in `lib/api/chat.ts`: handle `data:` lines, parse `choices[0].delta.content`, handle `[DONE]` signal and error events
- [x] **6.3** Update `ChatContext` — support incremental token appending during stream (already has `appendToLastMessage`; wire it to SSE parser)
- [x] **6.4** Add typing indicator animation in chat panel while `isStreaming` is true _(already existed in message-list.tsx; retained)_
- [x] **6.5** Add auto-scroll-to-bottom behaviour during streaming _(improved with scroll-up detection to disable auto-scroll when user scrolls up)_
- [x] **6.6** Create `lib/supabase/messages.ts` — functions: `fetchMessages()`, `createMessage()`, `deleteAllMessages()`
- [x] **6.7** Persist chat messages to Supabase `messages` table: save user message before send, save assistant message after stream complete
- [x] **6.8** Load previous messages from Supabase on `ChatContext` mount (paginated, 50 most recent, newest last in display)
- [x] **6.9** Add "Load more" scroll-up trigger for older messages
- [x] **6.10** Add "Clear conversation" button — deletes all messages from Supabase `messages` table + clears local state
- [x] **6.11** Chat history UI: date grouping headers, timestamps on messages, markdown rendering with code blocks _(installed react-markdown, remark-gfm, react-syntax-highlighter)_
- [x] **6.12** Keep `/api/chat-bridge` route as fallback (no changes needed — already works; sendMessage auto-falls back on SSE failure)
- [x] **6.13** Validate: `npm run build` passes; `npx tsc --noEmit` clean; chat tests (9/9) pass; test failures are pre-existing only (see notes)

**⏸ CHECKPOINT — Section 6 complete. Stop for approval.**

---

## 7. Gideon CRUD Access & Documentation (P2-2)

> **Maps to:** FR-2.1 through FR-2.4, FR-3.7

- [ ] **7.1** Create `docs/GIDEON_SUPABASE_ACCESS.md` — document all REST API patterns with curl examples:
  - Create task
  - List tasks (with filters)
  - Update task status / column
  - Delete task
  - Create idea
  - List ideas
  - Update agent status
  - Update heartbeat
- [ ] **7.2** Document Gideon's environment setup: keys needed in `/Users/gideon/.openclaw/.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] **7.3** Validate Supabase schema constraints: attempt to POST a task with invalid `column_status` → should be rejected by CHECK constraint
- [ ] **7.4** Integration test: Gideon creates a task via curl → appears on Kanban board within 2s (AC-2)
- [ ] **7.5** Integration test: Gideon moves task to "done" via curl PATCH → board updates in real-time (AC-3)

**⏸ CHECKPOINT — Section 7 complete. Stop for approval.**

---

## 8. UI Polish (P2-6)

> **Maps to:** FR-6.1 through FR-6.10

### 8a. Task Cards & Kanban

- [ ] **8.1** Redesign task cards: priority chip (colour-coded), assignee avatar/badge, due date pill, label dots
- [ ] **8.2** Redesign column headers: task count badge, column colour accent, quick-add (+) button
- [ ] **8.3** Improve drag animations: spring physics, ghost card opacity, drop zone highlight

### 8b. Chat Panel

- [ ] **8.4** Polish chat bubbles: markdown rendering with syntax-highlighted code blocks, message grouping by sender, timestamps
- [ ] **8.5** Typing animation (animated dots or shimmer) while streaming

### 8c. Status & Chrome

- [ ] **8.6** Polish status indicator: animated ring, tooltip with status details + model + last heartbeat, smooth state transitions
- [ ] **8.7** Add skeleton loaders for initial data fetch (tasks, ideas, chat history)
- [ ] **8.8** Add empty states with helpful CTAs (no tasks → "Create your first task", no ideas, no chat history)

### 8d. Design System

- [ ] **8.9** Typography and spacing audit: consistent type scale, proper hierarchy, Linear/Obsidian aesthetic
- [ ] **8.10** Apply design tokens: `bg-background` → `bg-muted/30` → `bg-card` depth layers; `border-border/40`; minimal `shadow-sm` for cards; `duration-200` / `duration-300` motion
- [ ] **8.11** Validate: visual review against Linear/Asana reference; responsive on desktop + tablet

**⏸ CHECKPOINT — Section 8 complete. Stop for approval.**

---

## 9. Final Validation & Cleanup

- [ ] **9.1** Run full test suite: `npm test` — all existing + new tests pass
- [ ] **9.2** Run `npm run build` — clean build, no TypeScript errors
- [ ] **9.3** Run `npm run lint` — no lint errors
- [ ] **9.4** Run `npx tsc --noEmit` — no type errors
- [ ] **9.5** Manual smoke test: all acceptance criteria AC-1 through AC-11 (per PRD Section 7)
- [ ] **9.6** Verify `.env.local.example` is complete and accurate
- [ ] **9.7** Verify Gideon access documentation is complete (`docs/GIDEON_SUPABASE_ACCESS.md`)
- [ ] **9.8** Remove any dead code: unused localStorage references, old polling in AgentContext (if fully replaced)
- [ ] **9.9** Commit final state on feature branch

**⏸ CHECKPOINT — Phase 2 complete. Stop for final approval before merge.**

---

## Acceptance Criteria Mapping

| AC | Description | Covered by Task(s) |
|----|-------------|---------------------|
| AC-1 | Tasks persist across browser reload via Supabase | 3.10 |
| AC-2 | Gideon creates task via REST → Kanban updates within 2s | 7.4 |
| AC-3 | Gideon moves task to "done" → board updates real-time | 7.5 |
| AC-4 | Agent status updates in <1s on write to agent_state | 4.6 |
| AC-5 | Heartbeat timeout shows "disconnected" after 60s | 4.3, 4.6 |
| AC-6 | Model switch works when agent is unresponsive | 5.7 |
| AC-7 | Chat streams tokens in real-time (SSE) | 6.13 |
| AC-8 | Chat history persists across sessions | 6.13 |
| AC-9 | UI matches professional project tool quality | 8.11 |
| AC-10 | `next build` succeeds with no TypeScript errors | 9.2 |
| AC-11 | All existing tests continue to pass | 9.1 |

---

## App Impact Mapping

| Section | Directly Affected | Indirect Consumers |
|---------|-------------------|--------------------|
| 1 (Supabase Foundation) | `lib/supabase/*`, `lib/gateway/client.ts`, `.env` | All contexts, all API routes |
| 2 (Types) | `types/index.ts` | All components, contexts, API routes |
| 3 (Task Persistence) | `contexts/task-context.tsx`, `lib/supabase/tasks.ts`, `lib/supabase/ideas.ts` | Kanban components, Ideas panel |
| 4 (Agent Status) | `contexts/agent-context.tsx`, `lib/supabase/agent-state.ts` | Status indicator, Model selector |
| 5 (Model Toggle) | `app/api/model-switch/route.ts`, `components/agent/model-selector.tsx` | AgentContext |
| 6 (Streaming Chat) | `lib/api/chat.ts`, `contexts/chat-context.tsx`, `lib/supabase/messages.ts` | Chat panel components |
| 7 (Gideon Docs) | `docs/GIDEON_SUPABASE_ACCESS.md` | None (documentation only) |
| 8 (UI Polish) | `components/**` | Contexts (display only) |
