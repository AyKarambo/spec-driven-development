---
description: Show where each feature stands in the spec-driven workflow and what the next step is
argument-hint: [optional feature slug/name to focus on]
disable-model-invocation: true
---

You report the **status** of spec-driven work in this repo, reading from **GitHub issues**. Read-only — do not create, edit, or close anything.

Focus (optional): $ARGUMENTS

**Preconditions:** `gh` installed + authenticated, GitHub remote present. If not, say so and stop.

1. Gather state:
   - Read `.claude/sdd/phase` if it exists (the active gate marker and its `<phase>:<slug>`).
   - List the SDD spec issues: `gh issue list --label sdd --state all --json number,title,labels,state,url,subIssuesSummary,updatedAt --limit 500`. Each feature's **slug** is the `<slug>` in its `[SDD] <slug>: …` title.
   - Apply the focus filter (`$ARGUMENTS`) if given. For a focused feature you may also read its body (`gh issue view <n> --json body`) to detect whether a **`## Technical Plan`** section is filled between the `sdd:plan` markers.
2. For each feature, report a compact line:
   `<slug>  [<status>]  plan <✓/–>  tasks ▸ N/M  → next: <step>  (#<n>)`
   - `[<status>]` = the `sdd:*` label (`draft`/`planned`/`in-progress`/`done`); if the issue is closed treat it as `done`.
   - `plan ✓` if the Technical Plan section is filled, `–` if empty/absent (only shown when you inspected the body — otherwise omit).
   - `tasks N/M` = `subIssuesSummary.completed` / `subIssuesSummary.total` (omit if the feature has no task sub-issues).
   - `next` = the next command to run: no plan and no tasks → `/techplan` (optional) or `/breakdown`; no tasks yet → `/breakdown`; open tasks remain → `/implement`; all tasks closed / `done` → "done".
3. If `.claude/sdd/phase` is set, call out the **active gate** (e.g. `spec:invoice-export`) and that file writes are restricted to `CLAUDE.md`/`AGENTS.md`/`.claude/**` until `/implement` runs or the marker is deleted (spec artifacts live in issues and are written via `gh`, so they're unaffected).
4. **Flag clutter.** Call out and suggest `/spec-cleanup`:
   - **finished-but-open** — a spec issue whose sub-issues are **all closed** (`completed == total`, `total > 0`) but that isn't yet `sdd:done`/closed (ready to finalize).
   - **orphans** — `sdd:task` issues with no live parent spec issue.
5. End with a one-line suggestion of the single most useful next action (which may be `/spec-cleanup` if clutter dominates).
