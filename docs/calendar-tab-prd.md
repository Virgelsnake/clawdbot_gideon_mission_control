# PRD — Mission Control Calendar Tab

## Product Goal
Enable date-driven project execution by introducing an innovative tactical calendar that turns due dates into actionable operational signals.

## Functional Requirements

### FR1 — Calendar Surface
- Add Calendar tab with hybrid layout:
  - Left: compact month navigator
  - Right: timeline/day-lane card feed for selected period
- Show projects only (from Mission Control tasks table)

### FR2 — Project Card Rendering
- Calendar cards must include:
  - title
  - priority
  - due date
  - status column
  - urgency state badge
- Clicking card opens existing project detail drawer

### FR3 — Scheduling Interactions
- Drag/drop card to another date
- Quick reschedule action on card (date picker)
- Persist updated due date to backend

### FR4 — Threshold Engine (date-only)
Compute urgency state daily from due date delta:
- <= 7 days: watch
- <= 3 days: warning
- <= 1 day: critical
- overdue: overdue

### FR5 — Automated Actions
- Notify on threshold transitions (warning/critical/overdue)
- Auto-reprioritise projects on critical and overdue states
  - warning -> minimum high consideration
  - critical -> high
  - overdue -> urgent
- Record activity log/event for each auto-reprioritisation

### FR6 — Quality Guardrails
- Do not auto-close or auto-complete projects
- Preserve manual review/done flow
- Keep actions explainable (why priority changed)

## Non-Functional Requirements
- Maintain dark tactical visual language
- Smooth drag/drop interactions
- Responsive on laptop and tablet
- Minimal token/compute overhead for heartbeat checks

## Acceptance Criteria
- Calendar tab available and default hybrid view works
- Drag/drop and quick-reschedule update due date correctly
- Project detail opens from calendar cards
- Threshold badges visible and correct for test fixtures
- Auto-reprioritisation triggers at configured thresholds
- Notifications fire on threshold transitions
