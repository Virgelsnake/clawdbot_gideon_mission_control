# Project Brief — Mission Control Calendar Tab (Mission Console)

## Objective
Build a tactical calendar tab that makes project due dates operationally meaningful, so Gideon can proactively act before deadlines slip while preserving Mission Control’s dark card-based aesthetic.

## User Decisions (confirmed)
- Default view: Hybrid (timeline + compact month navigator)
- Scope: Mission Control projects only
- Due granularity: Date-only (no time yet)
- Interactions required:
  - Drag/drop project cards across dates
  - Quick reschedule from calendar cards
  - Open full project detail drawer from calendar card
- Design direction: Minimal dark tactical (“mission console”)
- Automation authority: Notify + auto-reprioritise projects

## Operational Outcomes
- Projects approaching due date become visually and operationally urgent
- Gideon performs escalating actions based on threshold windows
- Late-risk projects are reprioritised automatically to protect delivery quality

## Proposed threshold policy (date-based)
- T-7 days: Watch state (soft highlight)
- T-3 days: At-risk warning + elevated priority consideration
- T-1 day: Critical warning + auto-prioritise queue
- Due date: Immediate action state
- Overdue: Escalation state + mandatory blocker/next-step update

## Success Criteria
- Calendar view is fast, readable, and visually aligned with Mission Control
- Date changes persist reliably from drag/drop and quick-reschedule
- Project detail drawer opens directly from calendar cards
- Threshold states and auto-reprioritisation are visible and auditable
