# Mission Control

Mission Control is the operational dashboard for managing AI-assisted delivery work.

## What it does
- Kanban-style project board (backlog → done)
- Ideas capture and conversion into projects
- Project execution context (Brief, PRD, Task List)
- Review gating with evidence requirements
- Workflow visibility widgets (missing docs, blocked, stale)
- Calendar and reminder views
- API routes for agent pickup/assign/complete flows

## Stack
- Next.js 16 (App Router)
- TypeScript
- Supabase (tasks, ideas, comments, reminders)
- Tailwind + Radix UI

## Local setup
```bash
cd projects/mission-control
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3011` (or the port shown in terminal).

## Quality commands
```bash
npm run lint
npm run test
npm run build
```

## Project documentation
Start at:
- `docs/INDEX.md`

Execution context for active projects:
- `docs/task-context/<project-id>.md`

## Delivery workflow
1. Create Project card
2. Link/create Brief + PRD + Task List
3. Move to In Progress only with context doc
4. Complete work with evidence
5. Move to Review then Done

## Deployment
- Netlify deploy target
- Recommended flow: feature branch -> PR -> approval -> merge -> deploy
