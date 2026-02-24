# Mission Control Documentation Index

## Start here
- `../README.md` — overview, setup, run commands
- `TASK-LIST-TEMPLATE.md` — **TEMPLATE for new projects** (copy this!)

## Active Projects
| Project | Brief | PRD | Task List | Context |
|---------|-------|-----|-----------|---------|
| Calendar Tab | `calendar-tab-project-brief.md` | `calendar-tab-prd.md` | `calendar-tab-task-list.md` | `task-context/1d13af94-...b2a1.md` |
| Repo Hardening | `repo-audit-project-brief.md` | `repo-audit-prd.md` | `repo-audit-task-list.md` | `task-context/82064509-...a8f3.md` |

## Templates & Standards
- `TASK-LIST-TEMPLATE.md` — Standard task list format with Agent Process Discipline

## Current operating docs
- `task-context/` — per-project execution context (auto-generated)
- `SECOND_BRAIN.md` — Knowledge base patterns
- `data-patterns-brain-schema.md` — Data architecture

## Historical / phase docs
- `PRD_clawdbot_gideon_mission_control_dashboard_2026-01-31.md`
- `PHASE2_BRIEFING_2026-02-06.md`
- `Implementation_Tasks_2026-01-31.md`
- `tts-research/`
- `clawdbot clean up project/`

## Document Hierarchy (conflict resolution)
If there is a conflict, prefer:
1. Active project task-context docs
2. Current PRD/brief for that project
3. TASK-LIST-TEMPLATE.md (for format/governance questions)
4. Historical docs last

## Creating a New Project
When creating a project card in Mission Control, generate these docs:
1. `docs/{project-slug}-project-brief.md` — Objective and outcomes
2. `docs/{project-slug}-prd.md` — Requirements and acceptance criteria
3. `docs/{project-slug}-task-list.md` — **Copy from TASK-LIST-TEMPLATE.md**
4. `docs/task-context/{task-id}.md` — Via API: `POST /api/task-context-doc`
