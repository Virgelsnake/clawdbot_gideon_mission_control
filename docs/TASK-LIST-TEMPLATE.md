# Task List Template — Mission Control Projects

> **COPY THIS TEMPLATE** when creating a new project task list.
> Replace `{{PROJECT_NAME}}`, `{{PROJECT_ID}}`, `{{PROJECT_SLUG}}` with actual values.

---

Project ID: `{{PROJECT_ID}}`
Project Name: {{PROJECT_NAME}}
Style: Minimal dark tactical (mission console)
Scope: *(define what is in/out of scope)*

**Status:** Phase A — Not Started
**Last Updated:** *(auto-populated on creation)*

---

## Quick Status
| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| A — *(Phase A Name)* | ⏳ Not Started | *(list)* |
| B — *(Phase B Name)* | ⏳ Not Started | *(list)* |
| C — *(Phase C Name)* | ⏳ Not Started | *(list)* |
| D — *(Phase D Name)* | ⏳ Not Started | *(list)* |
| E — QA | ⏳ Pending | Test fixtures, edge cases |
| F — Release | ⏳ Pending | Feature flags, validation bundle |

---

## Phase A — *(Name)* ⏳ NOT STARTED
- [ ] A1. *(Task description)*
  - Files: `components/...`, `app/...`
- [ ] A2. *(Task description)*
  - Files: `lib/...`
- [ ] A3. *(Task description)*
  - Files: `types/...`
- [ ] A4. *(Task description)*
  - Files: `...`

## Phase B — *(Name)* ⏳ NOT STARTED
- [ ] B1. *(Task description)*
- [ ] B2. *(Task description)*
- [ ] B3. *(Task description)*
- [ ] B4. *(Task description)*

## Phase C — *(Name)* ⏳ NOT STARTED
- [ ] C1. *(Task description)*
- [ ] C2. *(Task description)*
- [ ] C3. *(Task description)*
- [ ] C4. *(Task description)*

## Phase D — *(Name)* ⏳ NOT STARTED
- [ ] D1. *(Task description)*
- [ ] D2. *(Task description)*
- [ ] D3. *(Task description)*
- [ ] D4. *(Task description)*

## Phase E — QA + Hardening ⏳ PENDING
- [ ] E1. Add test fixtures for each state/scenario
- [ ] E2. Verify edge cases: *(define for this project)*
- [ ] E3. Validate responsiveness and visual consistency
- [ ] E4. Update docs/README with operator workflow

## Phase F — Release Readiness ⏳ PENDING
- [ ] F1. Feature flag guard: `{{PROJECT_SLUG}}_enabled`
- [ ] F2. Run validation bundle: lint, test, build
- [ ] F3. Prepare PR summary + screenshots + rollout/rollback notes

## Done Criteria
- [ ] *(Project-specific success criterion 1)*
- [ ] *(Project-specific success criterion 2)*
- [ ] *(Project-specific success criterion 3)*
- [ ] *(Project-specific success criterion 4)*

---

## Agent Process Discipline (Gideon Protocol)

**This section is MANDATORY and must not be removed.**

### Before Starting Work
1. **Read the task list first** — Open this file before writing any code
2. **Identify current phase** — Know which items are `[ ]`, `[~]`, or `[x]`
3. **Pick the next unstarted item** — Work in phase order (A → B → C → D → E → F)

### During Work
4. **Update status immediately** — When a task is done, change `[ ]` to `[x]` in the same session
5. **Mark partial progress** — Use `[~]` for "in progress / partially done"
6. **Note blockers** — Add inline comments if blocked (e.g., `Blocked: needs API key`)

### After Work
7. **Update the Quick Status table** — Reflect accurate % completion
8. **Update Last Updated timestamp** — Add date/time + your name
9. **Commit with task reference** — Include task ID in commit message (e.g., `A3: Add user auth flow`)

### Verification Checklist (Before saying "I'm done")
- [ ] Did I update the task list with `[x]` for completed items?
- [ ] Did I update the Quick Status table?
- [ ] Did I update the Last Updated timestamp?
- [ ] Did I verify the fix/feature actually works (not just "should work")?

**Violation of this protocol is a project hygiene failure.**

---

## Document References
- **Brief:** `docs/{{PROJECT_SLUG}}-project-brief.md`
- **PRD:** `docs/{{PROJECT_SLUG}}-prd.md`
- **Task Context:** `docs/task-context/{{PROJECT_ID}}.md`
- **INDEX:** `docs/INDEX.md`

---

*Template version: 1.0 | Last template update: 2026-02-24*
