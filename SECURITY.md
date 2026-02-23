# Security Policy

## Reporting vulnerabilities
Please report security issues privately to maintainers. Do not open public issues for exploitable vulnerabilities.

## Scope
- API routes under `app/api/*`
- Supabase integration and auth boundaries
- Environment variables and secret handling

## Rules
- Never commit secrets to git
- Keep `.env.local` out of version control
- Validate input on server routes
- Use least-privilege keys wherever possible

## Incident response
1. Reproduce and contain
2. Patch and test
3. Rotate exposed credentials
4. Publish advisory/changelog note
