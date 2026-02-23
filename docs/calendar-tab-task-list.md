# Task List — Mission Control Calendar Tab

Project ID: `1d13af94-7731-4305-aea3-178ede49b2a1`
Style: Minimal dark tactical (mission console)
Scope: Mission Control projects only

## Phase A — UX + Surface (Day 1)
- [ ] A1. Create calendar shell layout (hybrid split: compact month + timeline)
  - Files: `components/calendar/calendar-shell.tsx`, `app/(app)/calendar/page.tsx`
- [ ] A2. Build compact month navigator (date jump only)
  - Files: `components/calendar/calendar-grid.tsx`
- [ ] A3. Build timeline/day-lane view for selected date window
  - Files: `components/calendar/day-detail-panel.tsx`
- [ ] A4. Apply mission-console styling tokens + card treatment
  - Files: `components/calendar/calendar-styles.css` (or scoped component styles)

## Phase B — Data + Card Model (Day 2)
- [ ] B1. Add calendar types and urgency enums (`watch`, `warning`, `critical`, `overdue`)
  - Files: `types/calendar.ts`
- [ ] B2. Create calendar data adapter for projects with due dates
  - Files: `lib/calendar/calendar-api.ts`
- [ ] B3. Render project cards with priority, due date, status, urgency badge
  - Files: `components/calendar/day-detail-panel.tsx`
- [ ] B4. Wire card click -> existing project detail drawer
  - Files: `components/calendar/calendar-shell.tsx`, UI context hooks

## Phase C — Scheduling Interactions (Day 3)
- [ ] C1. Implement drag/drop date reassignment for project cards
  - Files: `components/calendar/drag-drop-provider.tsx`, calendar panel components
- [ ] C2. Implement quick-reschedule popover (Tomorrow, +3d, Next Monday, Custom)
  - Files: `components/calendar/quick-reschedule-popover.tsx`
- [ ] C3. Persist due-date updates to backend and reconcile optimistic UI
  - Files: `lib/calendar/calendar-api.ts`, relevant task update layer
- [ ] C4. Add undo/rollback toast flow on failed reschedule
  - Files: calendar shell + toast handlers

## Phase D — Threshold Engine + Automation (Day 4)
- [ ] D1. Implement threshold engine (T-7/T-3/T-1/overdue)
  - Files: `lib/calendar/threshold-engine.ts`
- [ ] D2. Trigger notifications on threshold transitions (warning/critical/overdue)
  - Files: calendar action layer + notification handler
- [ ] D3. Implement auto-reprioritisation policy
  - Rules: warning -> high consideration, critical -> high, overdue -> urgent
  - Files: `lib/calendar/reprioritise.ts`
- [ ] D4. Add auditable activity entries for each automatic reprioritisation
  - Files: task activity logger / API route

## Phase E — QA + Hardening (Day 5)
- [ ] E1. Add test fixtures for each urgency threshold state
- [ ] E2. Verify edge cases: no due date, same-day move, overdue transitions
- [ ] E3. Validate responsiveness and visual consistency with Mission Control theme
- [ ] E4. Update docs/README with operator workflow for calendar escalation system

## Phase F — Release Readiness (Day 6–7)
- [ ] F1. Feature flag guard: `calendar_v2_enabled`
- [ ] F2. Optional guard: `calendar_auto_reprioritise_enabled` (recommend-only mode first)
- [ ] F3. Run validation bundle: lint, test, build
- [ ] F4. Prepare PR summary + screenshots + rollout/rollback notes

## Done Criteria
- [ ] Calendar tab is live, usable, and visually aligned to mission-console design
- [ ] Drag/drop + quick-reschedule are reliable and persisted
- [ ] Threshold states and escalations are correct and auditable
- [ ] Auto-reprioritisation works per policy without false-noise behaviour
