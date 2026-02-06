---
auto_execution_mode: 0
description: ""
---
# Implementation Task Execution Workflow (Concise + Multi‑App Addendum)

## Purpose
Execute an implementation task list safely and verifiably, end-to-end, with minimal risk of regressions — including when working across multiple applications or packages. The task list is the single source of truth for scope and progress.

---

## Core Operating Rules

1. **One sub-task at a time**  
   Work only on the next incomplete sub-task. Do not bundle multiple sub-tasks into one change set.

2. **Small, reversible batches**  
   Keep each batch small enough to review quickly and revert in minutes.

3. **Validate before marking done**  
   Do not mark a task complete until relevant validation passes.

4. **Record failures as tasks (mandatory)**  
   If any validation fails (tests/build/lint/type-check), immediately create a remediation task in the task list and share a brief failure update message. Do not “debug silently”.

5. **Keep the task list current**  
   Mark completion, add missing tasks when discovered, and note scope/plan changes as they happen.

6. **Stop only when required**  
   Request approval only at defined checkpoints or before high-impact actions.

---

## Pre-Flight (Do Once Before Starting)

### 1) Confirm scope and Definition of Done
- Read the task list and any linked PRD/spec.
- Identify: in-scope applications/packages, acceptance criteria, and quality gates.

### 2) Verify environment
- Confirm toolchains and dependencies are installed.
- Confirm required services and environment variables are configured.

### 3) Baseline health check (must be green)
Run the repo’s standard checks (or the closest equivalents):
- Tests
- Build
- Lint (if applicable)
- Type-check (if applicable)

If baseline fails:
- Add a task: **0.0 Fix baseline (pre-existing failures)**
- Record the failing command(s) and key error snippet(s).
- Resolve baseline before proceeding.

### 4) Branch hygiene
- Ensure you are not working on `main`/`production`.
- Create a feature branch if needed.
- Keep the working tree clean before each batch.

---

## When You Must Stop for Approval

### A) Checkpoints (always stop)
- After completing a parent section (e.g., all `1.x` tasks).
- Before merging into an integration branch.
- Before any release/publish step.
- After a defined quality-gate task (e.g., “Run full suite”).

### B) High-impact actions (stop before doing)
- Deleting/renaming large sets of files or major folder moves.
- Broad refactors touching many modules/features or multiple apps.
- Database migrations/backfills or destructive data operations.
- Security-sensitive changes (auth, payments, permissions, PII).
- Major dependency upgrades or CI/build pipeline changes.

### C) Failure states (stop if not quickly resolved)
Stop and escalate if:
- Validation fails and the cause is not clear after a few attempts.
- The build breaks and you cannot restore it quickly.
- You discover a major sequencing/requirements issue not covered by the task list.

When escalating, include:
- What failed (logs/errors)
- What you tried
- 2–3 likely causes
- Recommended next step

---

## Execution Loop (Repeat Per Sub-Task)

### Step 1 — Select the next sub-task
- Take the first incomplete sub-task.
- Verify prerequisites/dependencies are complete.
- Identify which application(s)/package(s) are affected.

### Step 2 — Implement minimally
- Follow existing patterns and conventions.
- Keep changes strictly within the sub-task scope.
- Avoid opportunistic refactors unless required to complete the task safely.

### Step 3 — Targeted validation
Run the smallest validation that provides confidence:
- Unit tests related to the change (or nearest equivalent)
- Build the affected target(s)
- Lint/type-check if applicable

If the change touches core user flows, perform a brief manual smoke test.

If the change affects shared code, validate at least one consumer application (see “Multi‑Application Addendum”).

#### If validation fails (mandatory behaviour)
1. **Do not mark the current sub-task complete.**
2. **Create a remediation task in the task list immediately.** Use a consistent name, e.g.:
   - `X.Y.Z Fix failing tests after X.Y: <suite/module summary>`
   - `X.Y.Z Fix build failure after X.Y: <app/package>: <error summary>`
   - `X.Y.Z Fix lint/type-check failure after X.Y: <summary>`
3. **Include in the remediation task:**
   - failing command(s)
   - key error snippet(s) / file paths
   - affected app/package(s)
   - link/reference to logs if available
4. **Share a brief failure update message** (chat/PR/task notes as appropriate) stating:
   - what failed
   - the new remediation task ID/title
   - what you will do next (quick fix attempt vs escalate)
5. **Attempt a quick fix only if clearly scoped** (e.g., typo, missing import).  
   If not quickly resolved, stop and escalate per the “Failure states” rules.

### Step 4 — Update the task list and commit
- Mark the sub-task complete only after validation passes.
- Note discoveries (new tasks, ambiguity, constraints) in the task list.
- Commit with a clear message aligned to repo conventions.

### Step 5 — Continue
Proceed to the next sub-task unless a stop condition applies.

---

## Parent Section Completion (Checkpoint Procedure)

When all sub-tasks under a parent section are complete:

1. **Run full validation (best effort)**
   - Full test suite
   - Full build(s) for in-scope applications/packages
   - Lint/type-check (if applicable)

2. **Perform appropriate additional checks**
   - Security review for security-sensitive changes
   - Performance sanity check if performance-critical
   - Manual verification for user-facing flows

3. **Provide a short checkpoint summary**
   - What was completed
   - What was validated
   - Current state (green / known issues)
   - What is next
   - Any risks or open questions
   - Any remediation tasks created during the section

Then stop and request approval to proceed.

---

## Task List Maintenance

### Marking progress
- Mark tasks complete immediately after validation passes.

### Handling discoveries
If you discover missing/wrong tasks:
- Update the task list immediately.
- Document the reason briefly in a “Notes / Changes” section.
- If scope grows materially, stop at the next checkpoint and request approval for the revised plan.

### Scope-change tripwire
- If the task list grows or changes materially (approximately 20% or more), stop at the next checkpoint and request approval for the revised plan.

---

## Rollback / Recovery
- Prefer reverting the last small commit rather than attempting risky patch-ups.
- Restore a green build/test state before moving on.

---

## Multi‑Application Addendum

### App impact mapping (required)
For every sub-task, explicitly identify:
- **Directly affected app/package**
- **Indirect consumers** (if shared code is involved)

Document this briefly in the task list notes if non-obvious.

### Minimum validation matrix

| Change type | Required validation |
|---|---|
| Single app change | Tests + build for that app |
| Shared package change | Tests + build for package **and** at least one consumer app |
| Cross-app behaviour change | Targeted tests/builds for each affected app |

### Change boundaries
- Do not mark a shared-code task complete without validating a consumer.
- If validation for all consumers is not practical, note which validations are deferred and why.

---

## Multi‑Session Work

### End of session
- Record current status in task list notes: last completed task, next task, branch, blockers.
- Record any open remediation tasks.
- Commit only if the repo remains buildable and tests can still run.

### Start of next session
- Re-run baseline checks if the environment or base branch has changed.
- Continue from the next incomplete task.