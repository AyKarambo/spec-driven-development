---
description: Implement a single task — small, tested, focused and reviewable
argument-hint: [task number or short description]
disable-model-invocation: true
---

You implement **exactly one** task: $ARGUMENTS

1. **Clear the gate:** As your first action, delete `.claude/sdd/phase` if it exists — implementing a task is the point where the planning gate lifts and code may be written.
2. Read the task list under `specs/` (…tasks.md) and — if present — the project rules from CLAUDE.md / AGENTS.md.
3. **Grade the task's difficulty and pick the executor** — from its **Size** (S/M/L) and content:
   - **S — mechanical** (boilerplate, config, renames, one isolated file): dispatch a subagent on a **fast/small model** (e.g. Haiku).
   - **M — standard** (a function plus tests, clear boundaries): dispatch a **general-purpose subagent** on the default model.
   - **L — hard or risky** (cross-cutting changes, tricky logic, migrations, wide blast radius): implement it **yourself in the main conversation** — full context beats delegation.
   Give any subagent a **self-contained prompt**: the task text (Goal/Files/Check), the acceptance criteria it serves, the relevant plan excerpt, the project conventions, and the instruction to write/update tests. (`/auto` uses this same grading for its implementation loop.)
4. Implement **only this one** task — not several at once. Follow the conventions; write or update the appropriate **tests**.
5. Keep the change **small and focused** so the review is easy.
6. Afterwards, **verify the result yourself** regardless of who executed it — run the tests and read the diff against the task's **Check**; a subagent saying "done" is not verification. Then briefly summarize the diff, tick the task off in `…tasks.md`, and **advance the spec lifecycle** (edit `specs/<slug>.spec.md` frontmatter, refresh `updated:`):
   - if this was the **first** task checked (status was `planned`) → set `status: in-progress`.
   - if this was the **last** task (all items in `…tasks.md` now checked) → set `status: done`, and in your summary tell me the plan+tasks are now retire-able scaffolding: **suggest running `/spec-cleanup`** to archive them. Do **not** move or delete those files yourself — the finalize step only marks and offers.
   Then **stop** — for review (gate). Only after approval, the next task.

Tip for the check afterwards: native `/code-review` (diff, with `--fix` also applies fixes) or `/review` (pull request). The **merge stays a human decision** — no auto-gating.
