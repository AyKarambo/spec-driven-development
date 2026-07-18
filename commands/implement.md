---
description: Implement a single task from the spec issue's task checklist — small, tested, focused and reviewable
argument-hint: [task number or short description — empty = next unchecked task]
disable-model-invocation: true
---

You implement **exactly one** task: $ARGUMENTS

1. **Resolve the feature, then clear the gate:** if `.claude/sdd/phase` exists, read its `<phase>:<slug>` to get the active **slug**; otherwise infer the slug from the current branch or `$ARGUMENTS`. Then **delete `.claude/sdd/phase`** — implementing a task is the point where the planning gate lifts and code may be written.
2. **Preconditions:** `gh` installed + authenticated, GitHub remote present (stop with guidance if missing). Find the spec issue (`gh issue list --label sdd --state all --limit 500 --json number,title,url` → title starts with `[SDD] <slug>:`) and fetch its **live** body (`gh issue view <n> --json body,labels -q .body`) — read the `## Tasks` section between the `<!-- sdd:tasks:start -->` / `<!-- sdd:tasks:end -->` markers; it's the source of truth. **If that section is empty/missing, stop** and point to `/breakdown`. Also read the project rules from CLAUDE.md / AGENTS.md, if present.
3. **Pick one task:** match `$ARGUMENTS` to a checklist line (by its `T<n>` label or description text) that's still unchecked (`- [ ]`); if `$ARGUMENTS` is empty, take the first unchecked line in order. Implement **only this one** task — not several at once.
4. **Grade the task's difficulty and pick the executor** — from its **Size** (S/M/L) and content:
   - **S — mechanical** (boilerplate, config, renames, one isolated file): dispatch the **`sdd-quick`** subagent (pinned to Haiku).
   - **M — standard** (a function plus tests, clear boundaries): dispatch the **`sdd-standard`** subagent (pinned to Sonnet).
   - **L — hard or risky** (cross-cutting changes, tricky logic, migrations, wide blast radius): implement it **yourself in the main conversation** — full context beats delegation.
   Give the subagent a **self-contained prompt**: the task text (Goal/Files/Check), the acceptance criteria it serves (from the spec issue), the relevant `## Technical Plan` excerpt, the project conventions, and the instruction to write/update tests. (`/sdd-auto` uses this same grading for its implementation loop.)
5. Keep the change **small and focused** so the review is easy.
6. Afterwards, **verify the result yourself** regardless of who executed it — run the tests and read the diff against the task's **Check**; a subagent saying "done" is not verification. Then briefly summarize the diff, and update the issue:
   - Flip that task's `- [ ]` to `- [x]` within the `## Tasks` section of the body (leave the `## Spec`/`## Technical Plan` content and all marker pairs untouched), write the new body to a temp file, and `gh issue edit <n> --body-file <that file>`.
   - **Advance the spec's status label** (keep exactly one `sdd:*` status label — add the new one, and `--remove-label` only the *other* `sdd:*` status labels that are actually present):
     - if this was the **first** task checked (spec still `sdd:planned`) → add `sdd:in-progress`, remove `sdd:planned`.
     - if **all** checklist lines are now checked → add `sdd:done`, remove `sdd:in-progress`/`sdd:planned` (whichever is present), and **close the spec issue** (`gh issue close <n> --reason completed`). Tell me the feature is shipped; if any stale/orphaned SDD issues remain, mention `/spec-cleanup`.
   Then **stop** — for review (gate). Only after approval, the next task.

Tip for the check afterwards: native `/code-review` (diff, with `--fix` also applies fixes) or `/review` (pull request). The **merge stays a human decision** — no auto-gating, and the same goes for closing the spec issue.
