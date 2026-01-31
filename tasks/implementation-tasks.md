# ClawdBot Gideon Mission Control — Implementation Tasks

**PRD:** `/Users/steveshearman/.windsurf/plans/prd-clawdbot-mission-control-8af232.md`  
**Created:** 2026-01-31  
**Status:** In Progress

---

## Definition of Done (from PRD)

- [ ] All acceptance tests pass for implemented scope
- [ ] Lint (`eslint`) and type-check (`tsc --noEmit`) pass with no errors
- [ ] Build (`next build`) succeeds
- [ ] Manual smoke test on Safari and Chrome (macOS)
- [ ] PWA installable and functional offline for cached assets

---

## 1. Project Scaffold

### 1.1 Initialize Next.js 14 project with TypeScript
- [x] Run `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS, ESLint
- [x] Verify `npm run dev` starts successfully

### 1.2 Install and configure shadcn/ui
- [x] Run `npx shadcn@latest init`
- [x] Configure with default theme (neutral), CSS variables enabled
- [x] Install initial components: `button`, `input`, `card`, `dropdown-menu`, `dialog`, `sonner` (toast deprecated)

### 1.3 Install additional dependencies
- [x] Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for Kanban
- [x] Install `lucide-react` for icons
- [x] Install `next-pwa` for PWA support

### 1.4 Configure PWA basics
- [x] Create `public/manifest.json` with app name, icons, theme colors
- [x] Configure `next.config.mjs` with `next-pwa` wrapper
- [x] Add placeholder icons (192x192, 512x512)

### 1.5 Establish project structure
- [x] Create folder structure: `app/`, `components/`, `contexts/`, `lib/`, `types/`
- [x] Create `types/index.ts` with core type definitions (Task, Idea, AgentStatus, Message)
- [x] Verify build passes: `npm run build`

---

## 2. Layout Shell & Theme

### 2.1 Create theme provider and toggle
- [x] Create `components/providers/theme-provider.tsx` using `next-themes`
- [x] Install `next-themes` package
- [x] Create `components/ui/theme-toggle.tsx` with light/dark/system options
- [x] Default to system preference (FR-6.1)

### 2.2 Define color palette
- [x] Using shadcn/ui neutral theme with CSS variables (Obsidian/Linear palette deferred to custom theme extension)
- [x] Verify dark/light modes render correctly

### 2.3 Build main layout shell
- [x] Create `app/layout.tsx` with ThemeProvider, base HTML structure
- [x] Create `components/layout/header.tsx` with theme toggle
- [x] Create `components/layout/main-content.tsx` as container for Kanban
- [x] Create `components/layout/chat-panel.tsx` placeholder (collapsible right panel)
- [x] Verify responsive layout on desktop/tablet viewports

### 2.4 Write layout tests
- [x] Write E2E test: theme toggle switches between light/dark modes (FR-6.1)
- [x] Verify test passes

---

## 3. Status Indicator & Model Selector

### 3.1 Create AgentContext
- [x] Create `contexts/agent-context.tsx` with:
  - `status`: 'idle' | 'thinking' | 'active' | 'resting'
  - `currentModel`: string
  - `modelList`: string[]
  - `setStatus`, `setCurrentModel` actions
- [x] Provide mock initial values

### 3.2 Build status indicator component
- [x] Create `components/agent/status-indicator.tsx`
- [x] Implement color coding: idle (gray), thinking (pulsing yellow), active (green), resting (red) (FR-1.1)
- [x] Implement pulsing animation for 'thinking' and 'active' states (FR-1.2)
- [x] Display current model name beneath indicator (FR-1.3)

### 3.3 Build model selector dropdown
- [x] Create `components/agent/model-selector.tsx` using shadcn `dropdown-menu`
- [x] List available models from context (FR-2.1)
- [x] On selection, dispatch model change (wire to chat in Section 4) (FR-2.2)

### 3.4 Integrate into header
- [x] Add StatusIndicator and ModelSelector to header layout
- [x] Verify visual appearance matches Obsidian/Linear aesthetic

### 3.5 Write status indicator tests
- [x] Write unit test: status indicator renders correct color for each state (FR-1.1)
- [x] Write visual/E2E test: pulsing animation visible for thinking/active (FR-1.2)
- [x] Verify tests pass

---

## 4. Chat Interface

### 4.1 Create ChatContext
- [x] Create `contexts/chat-context.tsx` with:
  - `messages`: Message[]
  - `isStreaming`: boolean
  - `addMessage`, `appendToLastMessage`, `setStreaming` actions
- [x] Define Message type: `{ id, role: 'user' | 'assistant', content, timestamp }`

### 4.2 Build chat panel UI
- [x] Create `components/chat/chat-panel.tsx` (collapsible side panel) (FR-3.1)
- [x] Create `components/chat/message-list.tsx` displaying message history
- [x] Create `components/chat/message-bubble.tsx` with distinct user/agent styling (FR-3.2)
- [x] Create `components/chat/chat-input.tsx` with text input and send button (FR-3.3)

### 4.3 Implement API integration with SSE streaming
- [x] Create `lib/api/chat.ts` with `sendMessage()` function
- [x] Connect to `POST http://127.0.0.1:18789/v1/chat/completions` (FR-3.4)
- [x] Implement SSE streaming parser for `stream: true` responses (FR-3.5)
- [x] Handle connection errors gracefully (toast notification, retry option)

### 4.4 Create Next.js API route proxy (CORS fallback)
- [x] Create `app/api/chat/route.ts` as proxy to ClawdBot API
- [x] Support streaming responses through the proxy
- [x] Add environment variable for API token (do not hardcode)

### 4.5 Wire model selector to chat
- [x] When model is selected, send chat message instructing agent to swap models (FR-2.2)
- [x] Update displayed model name after successful swap (FR-2.3)

### 4.6 Write chat tests
- [x] Write integration test: chat sends request and receives response (FR-3.4)
- [x] Write integration test: streaming tokens render incrementally (FR-3.5)
- [x] Verify tests pass

---

## 5. Kanban Board

### 5.1 Create TaskContext
- [x] Create `contexts/task-context.tsx` with:
  - `tasks`: Task[]
  - `addTask`, `updateTask`, `deleteTask`, `moveTask` actions
- [x] Define Task type: `{ id, title, description?, column, createdAt, updatedAt }`
- [ ] Define columns: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'

### 5.2 Implement localStorage persistence
- [x] Create `lib/storage/tasks.ts` with load/save functions
- [x] Initialize TaskContext from localStorage on mount
- [x] Persist on every state change (FR-4.5)

### 5.3 Build Kanban board structure
- [x] Create `components/kanban/kanban-board.tsx` as main container
- [x] Create `components/kanban/kanban-column.tsx` for each column (FR-4.1)
- [x] Create `components/kanban/task-card.tsx` for individual tasks

### 5.4 Implement drag-and-drop with @dnd-kit
- [x] Set up DndContext in kanban-board
- [x] Make columns droppable with `useDroppable`
- [x] Make task cards draggable with `useDraggable` or `useSortable`
- [x] Handle `onDragEnd` to move tasks between columns (FR-4.2)
- [x] Ensure empty columns remain visible as drop zones

### 5.5 Implement task CRUD
- [x] Create `components/kanban/add-task-dialog.tsx` for new tasks (FR-4.3)
- [x] Implement inline edit mode on task cards (FR-4.4)
- [x] Add delete confirmation and action (FR-4.4)
- [x] Handle long titles (truncate with tooltip/expand)

### 5.6 Write Kanban tests
- [x] Write E2E test: task card can be dragged between columns (FR-4.2)
- [x] Write integration test: tasks persist across page reload (FR-4.5)
- [x] Verify tests pass

---

## 6. Ideas Backlog

### 6.1 Extend TaskContext for ideas
- [x] Add `ideas`: Idea[] to TaskContext
- [x] Define Idea type: `{ id, content, createdAt }`
- [x] Add `addIdea`, `deleteIdea`, `promoteIdea` actions
- [x] Persist ideas to localStorage (FR-5.4)

### 6.2 Build Ideas UI
- [x] Create `components/ideas/ideas-panel.tsx` as separate section/tab (FR-5.1)
- [x] Create quick-add input at top of panel (FR-5.2)

### 6.3 Implement promote to task
- [x] Add "Promote to Task" action on each idea (FR-5.3)
- [x] On promote: remove from ideas, create task in Kanban 'backlog' column
- [x] Show confirmation or toast on successful promotion

### 6.4 Integrate Ideas into layout
- [x] Add IdeasPanel alongside KanbanBoard in main layout

### 6.5 Write Ideas tests
- [x] Write unit test: promoting an idea removes it from Ideas (FR-5.3)
- [x] Write E2E test: promoting adds task to Kanban Backlog (FR-5.3)
- [x] Verify tests pass

---

## 7. Polish & PWA Finalization

### 7.1 Animations and micro-interactions
- [x] Add subtle transitions on hover/focus states
- [x] Smooth drag-and-drop animations
- [x] Loading states for chat streaming

### 7.2 Accessibility audit
- [x] Ensure keyboard navigation for all interactive elements
- [x] Add appropriate ARIA labels
- [ ] Test with screen reader (VoiceOver) - deferred

### 7.3 Mobile/tablet refinements
- [x] Test responsive layout on smaller viewports
- [x] Adjust chat panel behavior (full-screen modal on mobile)
- [x] Ensure touch-friendly tap targets

### 7.4 PWA finalization
- [x] Create proper app icons (192x192, 512x512)
- [x] Verify manifest.json is complete (FR-7.1)
- [ ] Test service worker caches static assets (FR-7.2) - requires build test
- [ ] Test "Add to Home Screen" on Chrome desktop (FR-7.3) - requires manual test
- [ ] Run Lighthouse PWA audit, target score > 90 - requires manual test

### 7.5 Final validation
- [x] Run full test suite — 26 tests passed
- [x] Run `eslint` — no errors
- [x] Run `tsc --noEmit` — no errors
- [x] Run `npm run build` — succeeds
- [ ] Manual smoke test on Safari (macOS) - deferred
- [ ] Manual smoke test on Chrome (macOS) - deferred

---

## Notes / Changes

_Record any scope changes, discoveries, or deferred items here._

- Task list regenerated after deletion on 2026-01-31

---

## Open Questions (from PRD)

1. **Model list:** What models should appear in the dropdown? → *Start with placeholder list; update when confirmed*
2. **Agent status source:** API endpoint to poll, or infer from chat? → *Mock initially; wire later*
3. **Chat history persistence:** localStorage or fresh each session? → *Default: persist in localStorage; can add clear option*
