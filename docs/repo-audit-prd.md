# PRD — Mission Control Repository Hardening

## Functional Requirements
1. Documentation foundation
   - Replace root README with product-level documentation
   - Add docs/INDEX with current vs archive map
   - Add CONTRIBUTING and SECURITY policies
2. Governance and workflow
   - Add CODEOWNERS
   - Add issue/PR templates
   - Document branch + deploy policy
3. Quality gates
   - Ensure deterministic scripts for lint/test/typecheck/build
   - Reduce lint noise by excluding generated artefacts
   - Fix high-impact failing tests
4. CI
   - Add GitHub Actions pipeline for PR validation

## Non-Functional Requirements
- Clear onboarding in under 30 minutes
- No ambiguous “source of truth” docs
- Minimal contributor friction

## Acceptance Criteria
- New contributor can clone, run, and validate project with documented commands
- PR checks run automatically and fail on quality regressions
- Documentation map clearly points to canonical files
