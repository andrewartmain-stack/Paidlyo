---
name: create-feature
description: Standard workflow for planning and implementing one approved feature in this project (plan, approve, implement, verify, report). Use whenever the user asks to build or implement a feature.
---

# Feature development

## Phase 1 — Plan (no file changes)
1. Read `docs/PROGRESS.md`. Confirm prerequisites from `docs/ROADMAP.md` are done.
2. Inspect only the relevant code (existing features, `src/components/ui`, `src/lib`).
3. For non-trivial features, delegate planning to the `architect` agent.
4. Present the plan: requirements, out of scope, files to change/create, DB changes,
   actions/routes, dependencies (prefer none), steps, tests, risks.
5. **Stop and wait for approval.**

## Phase 2 — Implement (approved scope only)
1. DB changes first, via the `database-change` skill.
2. Backend: schemas → queries → actions (`backend` agent if the work is sizable).
3. Frontend: components → page (`frontend` agent if sizable). Use the `create-component`
   skill for reusable components.
4. Tests for business logic in `tests/` or next to the code as `*.test.ts`.

Use subagents only when the work is large enough to benefit; small features are faster done directly.

## Phase 3 — Verify and report
1. `npm run check` must pass. Fix failures; never weaken tests or types to pass.
2. If UI changed, tell the user exactly what to click through in the browser.
3. Update `docs/PROGRESS.md` (and DATABASE.md / API.md if they changed).
4. Report briefly: files changed, what was implemented, check results, open issues,
   suggested commit message. Suggest running the `reviewer` agent.
5. Do not commit. Wait for approval before the next feature.

## Rules
- Do not refactor unrelated code or change existing behaviour silently.
- Follow existing conventions; keep the implementation minimal.
- No new dependencies without explicit approval.
