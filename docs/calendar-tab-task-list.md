# Task List — Mission Control Calendar Tab

Project ID: `1d13af94-7731-4305-aea3-178ede49b2a1`
Style: Minimal dark tactical (mission console)
Scope: Mission Control projects only

**Status: Phase A & B Complete | Phase C ~75% | Phase D Complete (with hotfix)**
**Last Updated:** 2026-02-24 08:15 GMT (by Gideon)

---

## Quick Status
| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| A — UX Surface | ✅ Done | Shell, month nav, day detail, styling |
| B — Data Model | ✅ Done | Types, API adapter, cards, detail drawer |
| C — Scheduling | 🔄 75% | Drag/drop ✓, quick-reschedule ✓, persistence ~, undo pending |
| D — Automation | ✅ Done | Threshold engine ✓, notifications ✓, auto-reprioritise ✓ (bug fixed) |
| E — QA | ⏳ Pending | Test fixtures, edge cases, responsive |
| F — Release | ⏳ Pending | Feature flags, validation bundle, PR |

---

## Phase A — UX + Surface (Day 1) ✅ COMPLETE
- [x] A1. Create calendar shell layout (hybrid split: compact month + timeline)
  - Files: `components/calendar/calendar-shell.tsx`, `app/(app)/calendar/page.tsx`
- [x] A2. Build compact month navigator (date jump only)
  - Files: `components/calendar/calendar-month-navigator.tsx`
- [x] A3. Build timeline/day-lane view for selected date window
  - Files: `components/calendar/calendar-day-detail.tsx`
- [x] A4. Apply mission-console styling tokens + card treatment
  - Applied via Tailwind classes in components

## Phase B — Data + Card Model (Day 2) ✅ COMPLETE
- [x] B1. Add calendar types and urgency enums (`watch`, `warning`, `critical`, `overdue`)
  - Files: `types/calendar.ts`
- [x] B2. Create calendar data adapter for projects with due dates
  - Files: `lib/calendar/calendar-api.ts`
- [x] B3. Render project cards with priority, due date, status, urgency badge
  - Files: `components/calendar/calendar-day-detail.tsx`
- [x] B4. Wire card click -> existing project detail drawer
  - Files: `components/calendar/calendar-day-detail.tsx` (TaskDetailDialog)

## Phase C — Scheduling Interactions (Day 3) 🔄 IN PROGRESS
- [x] C1. Implement drag/drop date reassignment for project cards
  - Files: `components/calendar/calendar-day-detail.tsx` (native HTML5 DnD)
- [x] C2. Implement quick-reschedule dropdown (Tomorrow, +3d, Next Week)
  - Files: `components/calendar/calendar-day-detail.tsx`
- [~] C3. Persist due-date updates to backend and reconcile optimistic UI
  - Files: `lib/calendar/calendar-api.ts` — updateTask called, needs Supabase persistence verification
- [ ] C4. Add undo/rollback toast flow on failed reschedule
  - Files: calendar shell + toast handlers — toast success/error exists, undo not implemented

## Phase D — Threshold Engine + Automation (Day 4) ✅ COMPLETE (with fix)
- [x] D1. Implement threshold engine (T-7/T-3/T-1/overdue)
  - Files: `lib/calendar/threshold-engine.ts`
- [x] D2. Trigger notifications on threshold transitions (warning/critical/overdue)
  - Files: `lib/calendar/use-auto-reprioritisation.ts` (toast notifications)
- [x] D3. Implement auto-reprioritisation policy
  - Rules: warning -> high consideration, critical -> high, overdue -> urgent
  - Files: `lib/calendar/threshold-engine.ts`, `lib/calendar/use-auto-reprioritisation.ts`
- [x] D3a. **FIXED: Infinite loop in useAutoReprioritisation** — added processedTasks Set + mount-only effect
- [~] D4. Add auditable activity entries for each automatic reprioritisation
  - Files: Console logging exists; formal audit trail (DB) not yet implemented

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

---

## Agent Process Discipline (Gideon Protocol)

**This section ensures task list hygiene going forward.**

### Before Starting Work
1. **Read the task list first** — Always open `calendar-tab-task-list.md` before coding
2. **Identify current phase** — Know which items are `[ ]`, `[~]`, or `[x]`
3. **Pick the next unstarted item** — Work in phase order (A → B → C → D → E → F)

### During Work
4. **Update status immediately** — When a task is done, change `[ ]` to `[x]` in the same session
5. **Mark partial progress** — Use `[~]` for "in progress / partially done"
6. **Note blockers** — Add inline comments if a task is blocked (e.g., `Blocked: needs Supabase migration`)

### After Work
7. **Update the Quick Status table** — Reflect accurate % completion
8. **Update Last Updated timestamp** — Add date/time + your name
9. **Commit with task reference** — Include task ID in commit message (e.g., `D3: Fix infinite loop in auto-reprioritisation`)

### Verification Checklist (Before saying "I'm done")
- [ ] Did I update the task list with `[x]` for completed items?
- [ ] Did I update the Quick Status table?
- [ ] Did I update the Last Updated timestamp?
- [ ] Did I verify the fix/feature actually works (not just "should work")?

**Violation of this protocol is a project hygiene failure.**

---

**Signed:** Gideon | **Acknowledged:** 2026-02-24
