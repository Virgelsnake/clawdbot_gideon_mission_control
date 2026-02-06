# PRD: Mission Control Phase 2 — Shared Persistence & Integration

**Version:** 1.0
**Date:** 6 February 2026
**Author:** Cascade (AI), commissioned by Steve
**Status:** Ready for Implementation
**Depends on:** Phase 1 (Complete)
**Blocks:** Phase 3, Phase 4, Phase 5

---

## 1. Overview

Phase 2 transforms Mission Control from a local-only UI shell into a **shared operational hub** where both Steve (via browser) and Gideon (via CLI/HTTP) have full CRUD access to tasks, ideas, and agent configuration. It replaces localStorage with Supabase, adds real-time agent status, enables reliable backend model switching, delivers streaming chat, and polishes the UI to professional quality.

**Problem solved:** Phase 1's localStorage persistence is invisible to Gideon. The agent cannot read or write tasks, the status indicator is client-side fiction, and model switching depends on the agent being responsive. Phase 2 fixes all of this.

---

## 2. Platforms & Release Targets

| Platform | In Scope | Notes |
|----------|----------|-------|
| **PWA (Web)** | ✅ | Primary target — local Next.js dashboard on iMac |
| iOS | ❌ | Deferred to Phase 4 (PWA installable on iOS) |
| Android | ❌ | Deferred to Phase 4 |

**Browser targets:** Safari (macOS), Chrome (macOS). Other modern browsers expected to work but not primary.

**Deployment:** Local only (`next dev` on iMac). No public endpoints, no tunnels. Supabase is the only cloud-hosted component (managed DB — acceptable).

---

## 3. Recommended Stack & Rationale

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 16 (App Router)** | Existing — no change |
| Language | **TypeScript** | Existing — no change |
| Styling | **Tailwind CSS v4 + shadcn/ui** | Existing — no change; sufficient for Linear/Obsidian polish |
| Icons | **Lucide React** | Existing — no change |
| Database | **Supabase (Postgres + Realtime)** | Shared persistence for UI + agent; real-time subscriptions; REST API for Gideon's CLI access; generous free tier |
| State | **React Context + Supabase** | Replace localStorage with Supabase; contexts remain as the client-side state layer |
| Streaming | **SSE (Server-Sent Events)** | Native browser support; already partially implemented in `/api/chat/route.ts` |
| Drag & Drop | **@dnd-kit** | Existing — no change |

**Alternatives considered for database:**
- *Firebase Realtime DB*: Viable, but Supabase gives Postgres (richer queries), REST API (easier for Gideon's curl access), and better local-dev story
- *SQLite + Litestream*: No real-time subscriptions without custom WebSocket layer
- *PocketBase*: Self-hosted simplicity, but less mature ecosystem

---

## 4. Goals

1. **Shared persistence** — Tasks, ideas, and agent state accessible to both the UI and Gideon via Supabase
2. **Real-time sync** — Changes by Gideon appear in the UI within 2 seconds (no polling, no reload)
3. **Reliable model switching** — Model toggle works even when the agent is unresponsive (token exhaustion recovery)
4. **Streaming chat** — Telegram-like UX with real-time token streaming and persistent history
5. **Professional UI** — Dashboard quality matching Asana/Monday/ClickUp, with Obsidian/Linear aesthetic
6. **Agent autonomy foundation** — Data layer that enables Phase 3 autonomous task pickup

---

## 5. User Stories & Personas

### Primary Persona: Agent Operator (Steve)

A technical user who manages the Gideon autonomous agent, monitors its state, and directs its work through chat and task assignments.

### Secondary Persona: Gideon (AI Agent)

An autonomous AI agent that reads and writes tasks/ideas via Supabase REST API, updates its own status, and responds to chat messages.

### User Stories

| ID | Story |
|----|-------|
| US-2.1 | As an operator, I want tasks to persist in a shared database so they survive browser refreshes and are accessible to Gideon. |
| US-2.2 | As an operator, I want to see tasks update in real-time when Gideon modifies them so I have live visibility. |
| US-2.3 | As an operator, I want the status indicator to reflect Gideon's actual state so I know if he's idle, thinking, active, or resting. |
| US-2.4 | As an operator, I want the status indicator to show "disconnected" if Gideon's heartbeat is stale so I know he's down. |
| US-2.5 | As an operator, I want to switch the AI model even when Gideon is unresponsive so I can recover from token exhaustion. |
| US-2.6 | As an operator, I want chat messages to stream in real-time so the experience feels like Telegram. |
| US-2.7 | As an operator, I want chat history to persist across sessions so I can review past conversations. |
| US-2.8 | As an operator, I want a polished, professional UI so the dashboard feels like a real product. |
| US-2.9 | As Gideon, I want to create and update tasks via REST API so I can manage my own workload. |
| US-2.10 | As Gideon, I want to update my status via REST API so the operator has live visibility. |

---

## 6. Functional Requirements

### 6.1 Supabase Backend (P2-1)

- **FR-1.1:** Create Supabase project with four tables: `tasks`, `ideas`, `agent_state`, `messages`
- **FR-1.2:** Schema must match the specification in the briefing document (Section 4.1), including CHECK constraints and defaults
- **FR-1.3:** Enable Supabase Realtime on `tasks`, `ideas`, and `agent_state` tables
- **FR-1.4:** RLS policies: permissive (`USING (true)`) for Phase 2 (single-user, local-only)
- **FR-1.5:** Add `@supabase/supabase-js` dependency to Mission Control
- **FR-1.6:** Create `lib/supabase/client.ts` (browser client using anon key) and `lib/supabase/server.ts` (server client using service role key)
- **FR-1.7:** Migrate `TaskContext` from localStorage to Supabase CRUD operations
- **FR-1.8:** Migrate ideas persistence from localStorage to Supabase
- **FR-1.9:** Add Supabase Realtime subscriptions in contexts for tasks, ideas, and agent_state
- **FR-1.10:** Create one-time data migration utility: localStorage → Supabase
- **FR-1.11:** Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 6.2 Gideon CRUD Access (P2-2)

- **FR-2.1:** Gideon accesses Supabase via REST API (HTTP/curl) using the service role key
- **FR-2.2:** Document all CRUD patterns with curl examples for: create task, update task status, delete task, create idea, list tasks
- **FR-2.3:** Service role key stored in Gideon's environment (`/Users/gideon/.openclaw/.env`)
- **FR-2.4:** Validate that Supabase schema constraints prevent bad data from Gideon (CHECK constraints, NOT NULL)

### 6.3 Real-Time Agent Status (P2-3)

- **FR-3.1:** `agent_state` table: single-row, tracks `status`, `current_model`, `model_list`, `last_heartbeat`, `updated_at`
- **FR-3.2:** Seed initial row for `agent_id='gideon'` with status `'idle'`
- **FR-3.3:** `AgentContext` subscribes to `agent_state` via Supabase Realtime (replaces current polling)
- **FR-3.4:** Status indicator updates within 1 second of Gideon writing to `agent_state`
- **FR-3.5:** Heartbeat timeout: if `last_heartbeat` is >60 seconds stale, UI shows "disconnected" regardless of `status` field
- **FR-3.6:** Status types are fixed: `idle | thinking | active | resting` — no new statuses this phase
- **FR-3.7:** Document Gideon's instructions for updating status via REST API

### 6.4 Backend Model Toggle (P2-4)

- **FR-4.1:** Create `POST /api/model-switch` API route that executes `openclaw models set <model>` server-side via `child_process.exec()`
- **FR-4.2:** After successful switch, update `agent_state.current_model` in Supabase
- **FR-4.3:** UI reflects model change instantly via Realtime subscription
- **FR-4.4:** Update `ModelSelector` component to call new `/api/model-switch` endpoint
- **FR-4.5:** Error handling: toast notification on switch failure with error message
- **FR-4.6:** This must work when the agent is completely unresponsive (primary use case)

### 6.5 Streaming Chat (P2-5)

- **FR-5.1:** Refactor `lib/api/chat.ts` to consume SSE stream from `/api/chat` (replace bridge polling)
- **FR-5.2:** SSE parser: handle `data:` lines, `[DONE]` signal, error events
- **FR-5.3:** `ChatContext` supports incremental token appending during stream
- **FR-5.4:** Typing indicator animation while streaming
- **FR-5.5:** Auto-scroll to bottom during streaming
- **FR-5.6:** Persist all chat messages to Supabase `messages` table
- **FR-5.7:** Load previous messages from Supabase on mount (paginated, newest first)
- **FR-5.8:** Chat history UI: scrollable, date grouping, timestamps, markdown rendering
- **FR-5.9:** "Clear conversation" button (deletes from Supabase, not just client)
- **FR-5.10:** Chat bridge route (`/api/chat-bridge`) remains as fallback for non-streaming tool interactions

### 6.6 UI Polish (P2-6)

- **FR-6.1:** Rich task cards: priority chips, assignee avatar/badge, due date pills, label dots, progress indicators
- **FR-6.2:** Styled column headers: task count badges, column color accents, quick-add button
- **FR-6.3:** Drag animation improvements: spring physics, ghost card, drop zone highlights
- **FR-6.4:** Chat panel polish: markdown rendering with code blocks, message grouping, typing animation
- **FR-6.5:** Status indicator: animated ring, tooltip with details, smooth transitions between states
- **FR-6.6:** Skeleton loaders for initial data fetch (tasks, ideas, chat history)
- **FR-6.7:** Empty states with helpful CTAs (no tasks, no ideas, no chat history)
- **FR-6.8:** Typography and spacing audit: consistent type scale, proper hierarchy
- **FR-6.9:** Motion: `duration-200` for micro-interactions, `duration-300` for panels, spring physics for drag
- **FR-6.10:** Design tokens: `bg-background` → `bg-muted/30` → `bg-card` depth layers; sparing accent usage; `border-border/40`; minimal shadows

### 6.7 Environment & Configuration

- **FR-7.1:** Update gateway client to check `OPENCLAW_*` env vars first, falling back to `CLAWDBOT_*`
- **FR-7.2:** Add `.env.local.example` documenting all required env vars
- **FR-7.3:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser (server-only)

---

## 7. Acceptance Criteria & Test Strategy

| ID | Criterion | Test Method | Maps to FR |
|----|-----------|-------------|------------|
| AC-1 | Tasks persist across browser reload via Supabase | Manual: create task → reload → task visible | FR-1.7 |
| AC-2 | Gideon creates a task via REST → appears on Kanban within 2s | Integration: curl POST → verify UI update | FR-2.1, FR-1.9 |
| AC-3 | Gideon moves a task to "done" → board updates in real-time | Integration: curl PATCH → verify column change | FR-2.1, FR-1.9 |
| AC-4 | Agent status updates in <1s when Gideon writes to `agent_state` | Integration: PATCH status → verify indicator change | FR-3.4 |
| AC-5 | Heartbeat timeout shows "disconnected" after 60s of no heartbeat | Manual: stop heartbeat → verify UI shows disconnected | FR-3.5 |
| AC-6 | Model switch works when agent is unresponsive | Manual: stop agent → switch model via UI → verify success | FR-4.6 |
| AC-7 | Chat streams tokens in real-time (SSE) | Manual: send message → verify tokens appear incrementally | FR-5.1 |
| AC-8 | Chat history persists across sessions | Manual: send messages → reload → history preserved | FR-5.6, FR-5.7 |
| AC-9 | UI matches professional project tool quality | Visual review against Asana/Linear reference | FR-6.* |
| AC-10 | `next build` succeeds with no TypeScript errors | CI: `npm run build` passes | All |
| AC-11 | All existing tests continue to pass | CI: `npm test` passes | All |

**Test approach:**
- **Unit tests:** Supabase client helpers, SSE parser, heartbeat timeout logic
- **Integration tests:** Supabase CRUD operations, Realtime subscription callbacks
- **E2E tests (Playwright):** Task persistence, real-time updates, model switching, chat streaming
- **Manual verification:** UI polish, design review, Gideon CLI access patterns

---

## 8. Definition of Done

- [ ] Supabase tables created with schema as specified (Section 4.1 of briefing)
- [ ] All task/idea CRUD operations use Supabase (localStorage removed)
- [ ] Supabase Realtime subscriptions active for tasks, ideas, agent_state
- [ ] Gideon can CRUD tasks and ideas via Supabase REST API
- [ ] Agent status indicator reflects real-time state from Supabase
- [ ] Heartbeat timeout displays "disconnected" correctly
- [ ] Model toggle works via backend CLI exec (not reliant on agent)
- [ ] Chat streams via SSE with Telegram-like UX
- [ ] Chat history persists to Supabase with date grouping, timestamps, markdown
- [ ] UI polished to professional standard (Linear/Obsidian aesthetic)
- [ ] All acceptance criteria (AC-1 through AC-11) pass
- [ ] `eslint`, `tsc --noEmit`, and `next build` pass cleanly
- [ ] Gideon's REST API access patterns documented with curl examples
- [ ] `.env.local.example` created with all required env vars

---

## 9. Non-Goals (Out of Scope)

- **Autonomous task pickup by Gideon** — deferred to Phase 3
- **Activity log / audit trail** — deferred to Phase 3
- **Cloud deployment** (Netlify/Vercel, tunnels) — deferred to Phase 4
- **Multi-device access** — deferred to Phase 4
- **Multi-user authentication** — deferred to Phase 5
- **Team collaboration** — deferred to Phase 5
- **Notification system** — deferred to Phase 5
- **Voice I/O** — deferred to Phase 5
- **Modifying OpenClaw source code** — never in scope; all customisation via Mission Control, env vars, or external config

---

## 10. Design Considerations

### Aesthetic: Linear/Obsidian Hybrid

The UI should follow the "Linear design" trend — characterised by:
- **Dark mode primary** with light mode support; background at 1-10% lightness (not pure black)
- **Bold typography** with consistent type scale and proper hierarchy
- **Sparing accent colour** — primary blue for CTAs, status colours for indicators only
- **Subtle depth** via background layering (`bg-background` → `bg-muted/30` → `bg-card`)
- **Minimal borders** — `border-border/40` for subtle separation, no heavy outlines
- **Minimal shadows** — `shadow-sm` for cards, `shadow-lg` for modals only
- **Linear motion** — `duration-200` micro-interactions, `duration-300` panel transitions, spring physics for drag
- **Clean linearity** — no zig-zagging content, consistent alignment, minimal CTAs per view

### Key UI Components to Redesign

| Component | Current | Target |
|-----------|---------|--------|
| Task cards | Minimal text-only | Rich: priority chip, assignee badge, due date pill, label dots |
| Column headers | Plain text + count | Styled: count badge, colour accent, quick-add (+) |
| Chat bubbles | Basic | Markdown, code blocks, timestamps, grouping |
| Status indicator | Emoji + dot | Animated ring, tooltip, state transitions |
| Empty states | Plain text | Illustrated with helpful CTAs |
| Loading states | None | Skeleton shimmer loaders |

---

## 11. Technical Considerations

### Supabase Schema

Four tables: `tasks`, `ideas`, `agent_state`, `messages`. Full SQL in briefing document Section 4.1.

Key schema decisions:
- `agent_state` is a **single-row table** (one agent: Gideon)
- `tasks.column_status` uses CHECK constraint matching `KanbanColumn` type
- `ideas.converted_to_task_id` is a FK reference to `tasks.id`
- `messages.role` includes `'system'` (broader than current TypeScript type which only has `'user' | 'assistant'`)

### Type Updates Required

`types/index.ts` needs updates:
- `MessageRole` should add `'system'`
- `Message` should add `session_id?: string`
- `AgentState` should add `lastHeartbeat: string`, `updatedAt: string`
- All types should add optional `id` as UUID string (Supabase primary keys)

### Security Model

- **Anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): browser-side, for Realtime subscriptions only
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`): server-side API routes + Gideon's environment; never in browser
- **RLS:** Permissive for Phase 2 (`USING (true)`); tighten in Phase 5
- **Gateway:** Remains bound to `127.0.0.1:18789` — not externally accessible

### Environment Variable Migration

Gateway client updated to prefer `OPENCLAW_*` with `CLAWDBOT_*` fallback:
```typescript
const url = process.env.OPENCLAW_GATEWAY_URL || process.env.CLAWDBOT_GATEWAY_URL || 'http://127.0.0.1:18789';
const token = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.CLAWDBOT_GATEWAY_TOKEN || '';
```

### Constraint

> **Do NOT modify OpenClaw source code.** OpenClaw must remain upgradeable via `npm update`. All customisation lives in Mission Control code, env vars, or external configuration.

---

## 12. Implementation Notes (Non-binding)

### Suggested Execution Order

```
Week 1: Foundation
├── Epic 1 (Supabase setup, migration, CRUD)
├── Epic 2 (Agent state table + Realtime subscription)
└── Epic 3 (Backend model switch)

Week 2: Live Integration
├── Epic 1 (Gideon access docs + testing)
├── Epic 2 (Heartbeat + testing)
├── Epic 3 (Refinement + testing)
└── Epic 4 (Streaming chat core)

Week 3: Polish
├── Epic 4 (Chat persistence + history UI)
├── Epic 5 (UI overhaul)
└── Final testing + documentation
```

### Key Implementation Risks

| Risk | Mitigation |
|------|------------|
| Supabase Realtime latency | Test early; fall back to short-interval polling if needed |
| SSE parser edge cases | Handle partial chunks, reconnection, error events |
| localStorage → Supabase migration data loss | Keep localStorage as read-only fallback for 1 release |
| `openclaw models set` CLI not available in PATH | Use absolute path or verify in API route before exec |

### Edge Cases

- Browser opens before Supabase is reachable → show graceful "connecting" state
- Gideon writes malformed data → schema constraints reject; API routes validate
- Simultaneous edits (Steve drags task while Gideon updates it) → last-write-wins is acceptable for Phase 2
- SSE stream disconnects mid-message → reconnect and append; don't lose partial content

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Task persistence reliability | 100% — no data loss across reloads |
| Real-time update latency (Gideon → UI) | < 2 seconds |
| Agent status update latency | < 1 second |
| Chat token streaming | First token visible within 500ms of send |
| Model switch success rate (agent unresponsive) | 100% |
| Build health | `next build` + `tsc --noEmit` + `eslint` all pass |
| Test suite | All existing + new tests pass |

---

## 14. Open Questions

1. **Supabase project region** — Which region for the Supabase project? Recommend closest to the iMac's location for lowest latency.
2. **Chat message pagination** — How many messages to load on mount? Suggest 50 most recent, with "load more" scroll-up.
3. **localStorage migration** — Should we auto-migrate existing data on first load, or provide a manual "Import" button?
4. **Gideon heartbeat frequency** — Briefing says 30s active / 60s idle. Confirm these intervals are acceptable.

---

## 15. Appendix: Source Notes

| Source | Key Facts Extracted |
|--------|--------------------|
| `docs/PHASE2_BRIEFING_2026-02-06.md` | Full scope, schema, architecture, acceptance criteria, implementation plan, security model |
| `docs/PRD_clawdbot_gideon_mission_control_dashboard_2026-01-31.md` | Phase 1 stack decisions, existing user stories, PRD format reference |
| `types/index.ts` | Current TypeScript types that need updating for Supabase compatibility |
| Linear design research (LogRocket) | Dark mode best practices, typography guidance, gradient/glassmorphism patterns, linearity principles |
