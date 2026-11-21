---
name: review-feature
description: Consistent review of the current feature's uncommitted changes before commit, using the reviewer agent. Use when the user asks to review the latest diff or a finished feature.
---

# Feature review

1. Collect context: the feature requirements (from the approved plan or `docs/PROGRESS.md`)
   and `git status --short` to list changed and untracked files.
2. Delegate to the `reviewer` agent with ONLY: the requirements and the list of changed files.
   Do not pass the development conversation.
3. Relay the reviewer's result to the user, grouped as critical / major / minor, with
   file:line references and suggested fixes, plus the `npm run check` result.
4. Do not fix anything automatically. Ask which issues to fix.
5. After fixes, re-run `npm run check`. When approved, suggest the commit message
   (`feat: ...`, `fix: ...`) — the user commits.
