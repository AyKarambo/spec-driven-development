---
description: Run the single next step of the workflow for a feature — and stop at its gate
argument-hint: [feature slug/name]
disable-model-invocation: true
---

You advance the feature **$ARGUMENTS** by exactly **one** step — then stop at that step's gate. You never skip gates or run several steps at once.

1. Determine the current state (same logic as `/status`, including finding the feature's `Feature: <slug>` GitHub issue and checking which sections it has): whether the issue's `## Spec` section exists, whether `## Plan` / `## Tasks` exist, how many `## Tasks` checkboxes are checked, and whether `.claude/sdd/phase` is set. (Resolve the slug from `$ARGUMENTS`, else the current branch.)
2. Decide the single next step and run it, following that command's own instructions exactly:
   - no spec (`## Spec` section/issue missing) → run **`/spec`**
   - spec but no plan → run **`/techplan`**
   - plan but no tasks → run **`/breakdown`**
   - tasks with unchecked items → run **`/implement`** for the next single task
   - all tasks checked → report **done**
3. Handle the gate marker exactly as that step would (planning steps set `.claude/sdd/phase`; `/implement` clears it first).
4. Stop and present the result for approval. Do **not** continue to the following step — that's my decision.
