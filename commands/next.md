---
description: Run the single next step of the workflow for a feature — and stop at its gate
argument-hint: [feature slug/name]
disable-model-invocation: true
---

You advance the feature **$ARGUMENTS** by exactly **one** step — then stop at that step's gate. You never skip gates or run several steps at once.

1. Determine the current state (same logic as `/status`): whether `specs/<slug>.spec.md` exists and is non-empty, its frontmatter `status:` if present, whether `specs/<slug>.plan.md` / `.tasks.md` exist, how many tasks are checked, and whether `.claude/sdd/phase` is set. (Resolve the slug from `$ARGUMENTS`, else the current branch.)
2. Decide the single next step and run it, following that command's own instructions exactly:
   - no spec (`specs/<slug>.spec.md` missing or empty) → run **`/spec`**
   - spec but no plan → run **`/techplan`**
   - plan but no tasks → run **`/breakdown`**
   - tasks with unchecked items → run **`/implement`** for the next single task
   - all tasks checked (or `status: done`) → report **done**, and if the plan/tasks scaffolding is still in `specs/`, suggest `/spec-cleanup` to retire it
3. Handle the gate marker exactly as that step would (planning steps set `.claude/sdd/phase`; `/implement` clears it first).
4. Stop and present the result for approval. Do **not** continue to the following step — that's my decision.
