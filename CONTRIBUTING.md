# Contributing

## Branching
- Do not commit directly to `main` for feature work.
- Use `feature/<name>` branches.

## Pull requests
PRs should include:
- Summary of behaviour change
- Screenshots for UI changes
- Test/validation evidence (`lint`, `test`, `build`)
- Rollback notes (if risky)

## Quality gate
Before opening PR:
```bash
npm run lint
npm run test
npm run build
```

## Documentation requirement
If you change workflow/architecture, update:
- `README.md`
- `docs/INDEX.md`
- relevant `docs/task-context/<project-id>.md`
