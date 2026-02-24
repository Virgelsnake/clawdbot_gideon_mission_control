# Task List — Mission Control Repository Hardening

Project ID: `82064509-a4e1-4d53-89a9-6d51a093a8f3`
Project Name: Mission Control Repo Hardening
Scope: Documentation, governance, quality gates, CI/CD

**Status:** Phase A & B Complete | Phase C ~50% | Phase D Not Started
**Last Updated:** 2026-02-24 08:30 GMT (by Gideon)

---

## Quick Status
| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| A — Documentation | ✅ Done | README, INDEX, CONTRIBUTING, SECURITY |
| B — Governance | ✅ Done | CODEOWNERS, PR template, issue templates |
| C — Quality Gates | 🔄 ~50% | typecheck ✓, lint scope ~, tests pending |
| D — CI | ⏳ Not Started | GitHub Actions workflow |
| E — QA | ⏳ Pending | Validation, edge cases |
| F — Release | ⏳ Pending | Final validation, PR |

---

## Phase A — Documentation Baseline ✅ COMPLETE
- [x] A1. Rewrite root README.md to project-specific content
- [x] A2. Create docs/INDEX.md canonical map
- [x] A3. Add CONTRIBUTING.md
- [x] A4. Add SECURITY.md

## Phase B — Governance ✅ COMPLETE
- [x] B1. Add CODEOWNERS
- [x] B2. Add PR template
- [x] B3. Add issue templates (bug/feature)
- [x] B4. Document branch/deploy policy

## Phase C — Quality Gates 🔄 IN PROGRESS
- [x] C1. Add/confirm typecheck script
- [~] C2. Exclude generated artefacts from lint scope
- [ ] C3. Resolve high-priority failing tests
- [ ] C4. Document quality commands in README

## Phase D — CI ⏳ NOT STARTED
- [ ] D1. Add GitHub Actions workflow (lint/test/build)
- [ ] D2. Ensure checks run on PRs and pushes
- [ ] D3. Validate with one clean run

## Phase E — QA + Hardening ⏳ PENDING
- [ ] E1. Validate all docs are current and accurate
- [ ] E2. Verify edge cases: fresh clone, missing env vars, CI failure paths
- [ ] E3. Test contribution workflow end-to-end
- [ ] E4. Update docs/README with final quality standards

## Phase F — Release Readiness ⏳ PENDING
- [ ] F1. Feature flag: N/A (repo hardening has no runtime flags)
- [ ] F2. Run validation bundle: lint, typecheck, test
- [ ] F3. Prepare PR summary + before/after comparison
- [ ] F4. Rollout plan: merge to main, announce to team

## Done Criteria
- [ ] Repo onboarding quality is external-ready
- [ ] CI and docs enforce consistent contribution standards
- [ ] Project can be opened to collaborators with minimal hand-holding

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
9. **Commit with task reference** — Include task ID in commit message (e.g., `C2: Exclude .next from lint`)

### Verification Checklist (Before saying "I'm done")
- [ ] Did I update the task list with `[x]` for completed items?
- [ ] Did I update the Quick Status table?
- [ ] Did I update the Last Updated timestamp?
- [ ] Did I verify the fix/feature actually works (not just "should work")?

**Violation of this protocol is a project hygiene failure.**

---

## Document References
- **Brief:** `docs/repo-audit-project-brief.md`
- **PRD:** `docs/repo-audit-prd.md`
- **Task Context:** `docs/task-context/82064509-a4e1-4d53-89a9-6d51a093a8f3.md`
- **INDEX:** `docs/INDEX.md`

---

*Template version: 1.0*
