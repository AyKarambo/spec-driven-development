---
description: Implement a single task — small, tested, focused and reviewable
argument-hint: [task number or short description]
disable-model-invocation: true
---

You implement **exactly one** task: $ARGUMENTS

1. **Clear the gate:** As your first action, delete `.claude/sdd/phase` if it exists — implementing a task is the point where the planning gate lifts and code may be written.
2. Read the task list under `specs/` (…tasks.md) and — if present — the project rules from CLAUDE.md / AGENTS.md.
3. Implement **only this one** task — not several at once.
4. Follow the conventions; write or update the appropriate **tests**.
5. Keep the change **small and focused** so the review is easy.
6. Afterwards: run the tests, briefly summarize the diff, tick the task off in `…tasks.md`, then **advance the spec lifecycle** (edit `specs/<slug>.spec.md` frontmatter, refresh `updated:`):
   - if this was the **first** task checked (status was `planned`) → set `status: in-progress`.
   - if this was the **last** task (all items in `…tasks.md` now checked) → set `status: done`, and in your summary tell me the plan+tasks are now retire-able scaffolding: **suggest running `/spec-cleanup`** to archive them. Do **not** move or delete those files yourself — the finalize step only marks and offers.
   Then **stop** — for review (gate). Only after approval, the next task.

Tip for the check afterwards: native `/code-review` (diff, with `--fix` also applies fixes) or `/review` (pull request). The **merge stays a human decision** — no auto-gating.
