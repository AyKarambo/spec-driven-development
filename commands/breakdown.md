---
description: Break the technical plan into small, testable tasks — and check spec↔plan↔tasks consistency
argument-hint: [feature slug/name — matching specs/<slug>.plan.md]
disable-model-invocation: true
---

You break the plan for **$ARGUMENTS** into small, individually implementable and testable **tasks**.

1. Identify the feature slug (from `$ARGUMENTS`, else the current branch). Read `specs/<slug>.plan.md` and `specs/<slug>.spec.md`. **If the plan is missing, stop** and point to `/techplan`.
2. **Gate marker:** write `.claude/sdd/phase` with the line `tasks:<slug>` and leave it in place.
3. Write a task list to `specs/<slug>.tasks.md` as a checklist (`- [ ] …`). Per task:
   - **Goal** – one sentence on what is achieved
   - **Files** – what will likely be touched
   - **Check** – how you can tell the task is done (test/behavior)
   - **Size** – rough (S/M/L)
4. Rules: each task **small and individually reviewable**, sensibly ordered (dependencies first), no task bigger than necessary.
5. **Consistency gate (analyze):** before finishing, verify that **every acceptance criterion in `specs/<slug>.spec.md`** maps to at least one task. List any acceptance criteria with no task (gaps) and any tasks that trace to no criterion (scope creep). Make the list complete, or flag what needs a spec/plan revision (`/revise`).

Note: `/breakdown` is its own command — don't confuse it with the native `/tasks` (= running background jobs).

Do **not** write code. Present the task list and the consistency check for review (gate).
