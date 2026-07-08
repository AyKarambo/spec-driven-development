---
description: Implement a single task sub-issue — small, tested, focused and reviewable
argument-hint: [task issue number or short description — empty = next open task]
disable-model-invocation: true
---

You implement **exactly one** task sub-issue: $ARGUMENTS

1. **Resolve the feature, then clear the gate:** if `.claude/sdd/phase` exists, read its `<phase>:<slug>` to get the active **slug**; otherwise infer the slug from the current branch or `$ARGUMENTS`. Then **delete `.claude/sdd/phase`** — implementing a task is the point where the planning gate lifts and code may be written.
2. **Preconditions:** `gh` installed + authenticated, GitHub remote present (stop with guidance if missing). Find the spec issue (`gh issue list --label sdd --state all --limit 500 --json number,title,url` → title starts with `[SDD] <slug>:`) and list its task sub-issues with state: `gh issue view <spec#> --json subIssues,subIssuesSummary`. Read the project rules from CLAUDE.md / AGENTS.md if present.
3. **Pick one task:** match `$ARGUMENTS` to an **open** sub-issue (by issue number or by title/description); if `$ARGUMENTS` is empty, take the next **open** sub-issue in order. Read that task issue's body (`gh issue view <task#> --json body,title`). Implement **only this one** task — not several at once.
4. Follow the conventions; write or update the appropriate **tests**.
5. Keep the change **small and focused** so the review is easy.
6. Afterwards: run the tests, briefly summarize the diff, then **close the task sub-issue** and advance the spec:
   - `gh issue close <task#> --reason completed --comment "<one-line summary of what was implemented>"`.
   - Re-read the parent's progress and labels (`gh issue view <spec#> --json subIssuesSummary,labels,state`). **Advance the spec's status label** (keep exactly one `sdd:*` status label — add the new one, and `--remove-label` only the *other* `sdd:*` status labels that are actually present):
     - if this was the **first** task closed (spec still `sdd:planned`) → add `sdd:in-progress`, remove `sdd:planned`.
     - if **all** sub-issues are now closed (`subIssuesSummary.completed == subIssuesSummary.total`) → add `sdd:done`, remove `sdd:in-progress`/`sdd:planned` (whichever is present), and **close the spec issue** (`gh issue close <spec#> --reason completed`). Tell me the feature is shipped; if any stale/orphaned SDD issues remain, mention `/spec-cleanup`.
   Then **stop** — for review (gate). Only after approval, the next task.

Tip for the check afterwards: native `/code-review` (diff, with `--fix` also applies fixes) or `/review` (pull request). The **merge stays a human decision** — no auto-gating.
