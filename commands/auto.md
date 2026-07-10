---
description: Autopilot — after the spec issue exists, run plan → tasks → implementation → review → PR autonomously
argument-hint: [feature slug/name — or empty to infer from the current branch]
disable-model-invocation: true
---

You take the feature **$ARGUMENTS** on **autopilot**: everything after the approved spec — technical plan, task breakdown, implementation, code review, and pull request — runs autonomously in one go, without stopping at the intermediate review gates. Two human decisions are never automated: **the spec approval** (the entry ticket) and **the merge** (the exit — you end at an open PR).

Specs, plans, and tasks live in **GitHub issues** (see the other SDD commands). **Preconditions:** `gh` installed + authenticated, and a GitHub remote (stop with guidance if missing).

## Entry check — the one gate autopilot cannot skip

1. Resolve the **slug** from `$ARGUMENTS`, else the current branch. State the slug you resolved.
2. **Require an approved spec issue:** find it with `gh issue list --label sdd --state all --limit 500 --json number,title,body,state,labels,url` and match the title prefix `[SDD] <slug>:`. The spec issue existing *is* the approval — `/spec` only creates it after approval. If none exists, **stop** and point to `/spec`. Autopilot never writes or approves a spec itself. If the issue is closed (a `done`/reverse-spec feature), reopen it only if there's genuinely new work; otherwise stop and ask.
3. Read the spec issue body. If its **Open Questions** contain anything that materially changes what to build, **stop and ask** those questions first — don't guess intent autonomously.
4. **Branch safety:** if you're on the default branch (`main`/`master`), create and switch to a feature branch (e.g. `feature/<slug>`) before anything else — autopilot commits as it goes and ends in a PR.

## Resume from wherever the feature stands

Autopilot can be entered at **any point after the spec issue exists** — right after `/spec`, mid-planning, mid-implementation, or with all tasks already done. Determine the current state (same logic as `/status`): is the `## Technical Plan` section between the `sdd:plan` markers filled? is the `## Tasks` section between the `sdd:tasks` markers non-empty, and how many of its checkboxes are checked vs total? what is the `sdd:*` status label? Then run **only the missing phases, in order**. Each phase follows its own command's instructions — including its gate-marker behavior — with exactly one difference: **instead of stopping for approval, print the phase result compactly and continue.**

- **No plan** → run `/techplan`'s instructions (marker `plan:<slug>`, parallel `Explore` research, fill the `## Technical Plan` section of the spec issue, relabel `sdd:planned`) — then continue. (The plan is optional for a small feature; skip straight to breakdown if it clearly doesn't need one.)
- **No `## Tasks` checklist yet** → run `/breakdown`'s instructions (marker `tasks:<slug>`, fill the `## Tasks` section with a checklist, run the spec↔tasks consistency check). If the check finds coverage gaps, fix the task list until every acceptance criterion is covered. If it surfaces a genuine contradiction in the spec, **stop** — that's a `/revise` decision, not yours.
- **Unchecked tasks in the checklist** → the implementation loop below.
- **All tasks already checked** → skip straight to review & PR.

## Implementation loop — sub-agents graded by difficulty

As the first implementation action, **delete `.claude/sdd/phase`** — same contract as `/implement`: this is the moment feature code may be written. Then work through the **unchecked** tasks in the `## Tasks` checklist **in order** (the order encodes dependencies):

1. **Grade each task's difficulty** from its Size (S/M/L) and content, and pick the executor accordingly — this is the same executor grading `/implement` uses:
   - **S — mechanical** (boilerplate, config, renames, one isolated file): a subagent on a **fast/small model** (e.g. Haiku) with a tight prompt.
   - **M — standard** (a function plus tests, clear boundaries): a **general-purpose subagent** on the default model.
   - **L — hard or risky** (cross-cutting changes, tricky logic, migrations, wide blast radius): do it **yourself in the main conversation** — full context beats delegation — or use a high-capability/high-effort subagent only if the task is genuinely self-contained.
2. Give every subagent a **self-contained prompt**: the task text (Goal/Files/Check from its checklist line), the acceptance criteria it serves, the relevant `## Technical Plan` excerpt, the project conventions (CLAUDE.md / AGENTS.md), and the instruction to write/update tests.
3. **Verify every result yourself** — run the tests, read the diff, check it against the task's **Check**. A subagent saying "done" is not verification.
4. On success: **flip that task's `- [ ]` to `- [x]`** in the `## Tasks` section and push the updated issue body (`gh issue edit <n> --body-file <temp>`), advance the spec's status label exactly as `/implement` does (first checked task → add `sdd:in-progress`/remove `sdd:planned`; last → add `sdd:done`, remove the other `sdd:*` status label, and close the spec issue), and **commit** — one focused commit per task, so the PR reads as a reviewable series.
5. **Stop rules** — autopilot stops and reports instead of pushing through when:
   - a task fails verification **twice** (after one repair attempt),
   - a subagent reports a real blocker, or the work contradicts the spec,
   - anything needs a scope decision that belongs to the human.
   When stopping: report honestly what is done and committed, what failed, and why. A later `/auto` (or `/implement`) resumes from the still-unchecked tasks.

Run tasks sequentially by default; parallelize via subagents only when tasks are provably independent (no shared files).

## Review, then pull request

1. **Code review — if not already done.** Unless a review of this feature's diff already happened (in this run, or visibly earlier — e.g. review-fix commits or existing PR review comments), review the **full feature diff** before opening the PR: prefer the native `/code-review`; if it's unavailable, dispatch a reviewer subagent over the diff hunting correctness, security, and spec-conformance issues against the acceptance criteria. Apply clear fixes (as their own commit); list anything you deliberately left open.
2. **Final self-check:** every acceptance criterion met, tests green, every task in the checklist checked, spec issue labeled `sdd:done` and closed.
3. **PR:** push the branch and open the pull request with `gh` — title from the spec's intent; body with a summary, a link to the **spec issue** (and `Closes #<spec#>` so merging closes it if it isn't already), the acceptance criteria as a checklist, and the review outcome. If a PR for this branch already exists, push and update it instead of creating a duplicate. No remote or no `gh`? Stop and report — the branch is ready locally.
4. **Never merge.** End with a compact report: which phases ran, which tasks went to which executor (S/M/L), review findings and fixes, and the PR link. The merge is the human's decision.
