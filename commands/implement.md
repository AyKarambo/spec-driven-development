---
description: Implement a single task — small, tested, focused and reviewable
argument-hint: [task number or short description]
disable-model-invocation: true
---

You implement **exactly one** task: $ARGUMENTS

1. **Clear the gate:** As your first action, delete `.claude/sdd/phase` if it exists — implementing a task is the point where the planning gate lifts and code may be written.
2. Identify the feature slug and find its `Feature: <slug>` GitHub issue (search as in `/techplan`); fetch its **live** body and read the `## Tasks` section — the issue is the source of truth, there is no local copy to fall back to. **If no such issue/section exists or GitHub access isn't available, stop** and point to `/breakdown` (or to setting up `gh`/a GitHub MCP server). Also read the project rules from CLAUDE.md / AGENTS.md, if present.
3. Locate the task matching `$ARGUMENTS` (or the first unchecked one if unspecified).
4. Implement **only this one** task — not several at once.
5. Follow the conventions; write or update the appropriate **tests**.
6. Keep the change **small and focused** so the review is easy.
7. Afterwards: run the tests, briefly summarize the diff, then flip that task's `- [ ]` to `- [x]` within the `## Tasks` section of the issue body and push it (`gh issue edit <number> --body-file -`), leaving `## Spec`/`## Plan` untouched. If that was the last unchecked task, say so and suggest closing the issue — do **not** close it yourself.
8. **Stop** — for review (gate). Only after approval, the next task.

Tip for the check afterwards: native `/code-review` (diff, with `--fix` also applies fixes) or `/review` (pull request). The **merge stays a human decision** — no auto-gating, and the same goes for closing the tasks issue.
