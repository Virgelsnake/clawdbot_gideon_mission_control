# PRD: ClawdBot Gideon Mission Control Dashboard

A PWA dashboard for managing and monitoring the ClawdBot Gideon autonomous AI agent, featuring task management (Kanban + Ideas backlog), agent chat with SSE streaming, and real-time status/model visibility.

---

## 1. Overview

ClawdBot Gideon Mission Control is a single-page Progressive Web App that provides a unified interface for:

- **Task oversight** via a Kanban board and ideas backlog
- **Agent interaction** through an integrated chat panel proxying the ClawdBot API
- **System visibility** with a status indicator and model selector

The design is inspired by Obsidian and Linear: minimal, clean, and functional in both light and dark modes.

---

## 2. Platforms & Release Targets

| Platform | In Scope | Notes |
|----------|----------|-------|
| **PWA (Web)** | ✅ | Primary target |
| iOS | ❌ | Deferred (PWA installable on iOS) |
| Android | ❌ | Deferred (PWA installable on Android) |

**Browser targets:** Safari (macOS), Chrome (macOS). Other modern browsers expected to work but not primary.

**Device:** iMac desktop as primary; responsive for tablet/mobile secondary use.

---

## 3. Recommended Stack & Rationale

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 14 (App Router)** | Modern React with SSR/SSG flexibility, excellent DX, built-in routing |
| Language | **TypeScript** | Type safety, better refactoring, IDE support |
| Styling | **Tailwind CSS + shadcn/ui** | Utility-first CSS with pre-built accessible components; Obsidian/Linear aesthetic easily achievable |
| Icons | **Lucide React** | Clean, consistent icon set |
| State | **React Context + localStorage** | Simple; external DB wired later |
| PWA | **next-pwa** | Service worker and manifest generation |
| Drag & Drop | **@dnd-kit** | Accessible, performant Kanban interactions |

**Alternatives considered:**
- *Vite + React*: Lighter, but loses Next.js SSR/routing benefits
- *SvelteKit*: Great DX, but smaller ecosystem for shadcn-style components

---

## 4. Goals

1. Provide at-a-glance visibility into ClawdBot Gideon's status and active model
2. Enable direct chat interaction with the agent without switching tools
3. Offer structured task management (Kanban + Ideas) to track work and initiatives
4. Deliver a clean, distraction-free UI matching Obsidian/Linear aesthetics
5. Support offline access and installability as a PWA

---

## 5. User Stories & Personas

### Primary Persona: Agent Operator (You)

A technical user who manages the ClawdBot Gideon autonomous agent, monitors its state, and directs its work through chat and task assignments.

### User Stories

| ID | Story |
|----|-------|
| US-1 | As an operator, I want to see the agent's current status (idle/thinking/active/resting) so I know if it's available. |
| US-2 | As an operator, I want to see which AI model the agent is using so I understand its capabilities. |
| US-3 | As an operator, I want to select a different model from a dropdown so the agent switches models. |
| US-4 | As an operator, I want to chat with the agent directly so I can give instructions and receive responses. |
| US-5 | As an operator, I want to manage tasks on a Kanban board so I can track work across stages. |
| US-6 | As an operator, I want to capture ideas in a backlog and promote them to tasks when ready. |
| US-7 | As an operator, I want to toggle between light and dark mode for comfortable use. |
| US-8 | As an operator, I want to install the dashboard as a PWA for quick access. |

---

## 6. Functional Requirements

### 6.1 Status Indicator

| ID | Requirement |
|----|-------------|
| FR-1.1 | Display agent status with color coding: idle (gray), thinking (pulsing yellow), active (green), resting (red). |
| FR-1.2 | Apply pulsing animation when agent is in "thinking" or "active" state. |
| FR-1.3 | Display the currently active AI model name beneath the status indicator. |

### 6.2 Model Selector

| ID | Requirement |
|----|-------------|
| FR-2.1 | Provide a dropdown listing available models. |
| FR-2.2 | On model selection, send a chat message instructing the agent to swap to the selected model. |
| FR-2.3 | Update the displayed model name after successful swap. |

### 6.3 Chat Interface

| ID | Requirement |
|----|-------------|
| FR-3.1 | Provide a collapsible chat panel (side panel or modal). |
| FR-3.2 | Display message history with distinct user and agent message bubbles. |
| FR-3.3 | Provide a text input with send button. |
| FR-3.4 | Connect to ClawdBot API at `POST http://127.0.0.1:18789/v1/chat/completions` with Bearer auth. |
| FR-3.5 | Support SSE streaming (`stream: true`) for real-time response rendering. |

### 6.4 Kanban Board

| ID | Requirement |
|----|-------------|
| FR-4.1 | Display columns: Backlog → To Do → In Progress → Review → Done. |
| FR-4.2 | Allow drag-and-drop of task cards between columns. |
| FR-4.3 | Support creating new tasks with title (required) and description (optional). |
| FR-4.4 | Support editing and deleting tasks inline. |
| FR-4.5 | Persist tasks to localStorage. |

### 6.5 Ideas Backlog

| ID | Requirement |
|----|-------------|
| FR-5.1 | Provide a separate section/tab for ideas. |
| FR-5.2 | Support quick-add input for capturing ideas. |
| FR-5.3 | Provide "Promote to Task" action that moves an idea to the Kanban Backlog column. |
| FR-5.4 | Persist ideas to localStorage. |

### 6.6 Theme & Layout

| ID | Requirement |
|----|-------------|
| FR-6.1 | Provide dark and light mode with toggle; default to system preference. |
| FR-6.2 | Use neutral Obsidian/Linear palette (dark grays, muted accents, clean typography). |
| FR-6.3 | Responsive layout optimized for desktop; functional on tablet/mobile. |

### 6.7 PWA

| ID | Requirement |
|----|-------------|
| FR-7.1 | Provide a valid `manifest.json` with app name, icons, and theme colors. |
| FR-7.2 | Register a service worker for offline caching of static assets. |
| FR-7.3 | Support "Add to Home Screen" installation prompt. |

---

## 7. Acceptance Criteria & Test Strategy

| Requirement | Acceptance Criteria | Test Type |
|-------------|---------------------|-----------|
| FR-1.1 | Status indicator renders with correct color for each state | Unit |
| FR-1.2 | Pulsing animation visible when state is "thinking" or "active" | Visual / E2E |
| FR-3.4 | Chat sends request to ClawdBot API and receives response | Integration |
| FR-3.5 | Streaming tokens render incrementally in chat bubble | Integration |
| FR-4.2 | Task card can be dragged from one column to another | E2E (Playwright) |
| FR-4.5 | Tasks persist across page reload | Integration |
| FR-5.3 | Promoting an idea removes it from Ideas and adds to Kanban Backlog | Unit / E2E |
| FR-6.1 | Theme toggle switches between light and dark mode | E2E |
| FR-7.3 | PWA installable on Chrome desktop | Manual / E2E |

**Test-first approach:** Write acceptance tests (Playwright E2E + Vitest unit) before implementing each feature.

---

## 8. Definition of Done

- [ ] All acceptance tests pass for implemented scope
- [ ] Lint (`eslint`) and type-check (`tsc --noEmit`) pass with no errors
- [ ] Build (`next build`) succeeds
- [ ] Manual smoke test on Safari and Chrome (macOS)
- [ ] PWA installable and functional offline for cached assets

---

## 9. Non-Goals (Out of Scope)

- Voice input/output for chat (future enhancement)
- Native iOS/Android apps (PWA covers mobile for now)
- Multi-user authentication or collaboration
- Cloud database persistence (localStorage only for v1)
- Agent status polling from backend (hardcoded/mock initially; wire later)

---

## 10. Design Considerations

**Visual Style:**
- Obsidian/Linear-inspired: dark grays (`#1e1e1e`, `#2d2d2d`), muted accents (blue `#5c7cfa`, green `#40c057`, yellow `#fab005`, red `#fa5252`)
- Clean sans-serif typography (Inter or system font stack)
- Generous whitespace, subtle borders, minimal shadows

**Layout:**
- Top-left: Status indicator + model display/selector
- Center: Kanban board (main workspace)
- Right or bottom: Chat panel (collapsible)
- Top-right: Theme toggle

---

## 11. Technical Considerations

**API Integration:**
```
POST http://127.0.0.1:18789/v1/chat/completions
Authorization: Bearer 8ea3d35963731d514bc9bae871827ffbb36b0a73849d184d
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "..."}],
  "stream": true
}
```

**CORS:** API is local; may need proxy if CORS issues arise. Consider Next.js API route as fallback proxy.

**State Architecture:**
- `AgentContext`: status, currentModel, modelList
- `TaskContext`: tasks, ideas
- `ChatContext`: messages, isStreaming

---

## 12. Implementation Notes

**Suggested module order:**
1. Project scaffold (Next.js + Tailwind + shadcn/ui + PWA)
2. Layout shell with theme toggle
3. Status indicator + model selector (mock data initially)
4. Chat panel with SSE streaming
5. Kanban board with @dnd-kit
6. Ideas backlog with promote action
7. Polish: animations, accessibility, mobile refinements

**Edge cases:**
- Handle API connection errors gracefully (show toast, retry option)
- Handle empty Kanban columns (drop zone still visible)
- Truncate long task titles; show full on hover/expand

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Agent status visible on load | < 500ms |
| Chat response starts streaming | < 2s (dependent on API) |
| Task drag-drop latency | < 100ms perceived |
| PWA Lighthouse score | > 90 |

---

## 14. Open Questions

1. **Model list:** What models should appear in the dropdown? (Provide static list or we can start with placeholders.)
2. **Agent status source:** Is there an API endpoint to poll for agent status, or should we infer from chat activity?
3. **Chat history persistence:** Should chat history persist in localStorage, or start fresh each session?

---

## 15. Appendix: Source Notes

| Source | Key Facts Extracted |
|--------|---------------------|
| Planning conversation | Platforms: PWA only; API endpoint and auth; model swap via chat instruction; Obsidian/Linear palette |
| `clawdbot-mission-control-8af232.md` | Tech stack, component breakdown, file structure, implementation order |

---

*PRD generated per /create-prd workflow. Ready for implementation upon approval.*
