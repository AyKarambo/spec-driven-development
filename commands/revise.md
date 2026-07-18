---
description: Update an existing spec issue / plan section / task checklist when requirements change, and flag stale downstream artifacts
argument-hint: [feature slug/name + what changed]
disable-model-invocation: true
---

You **revise** an existing artifact for the feature: $ARGUMENTS

The spec, plan, and tasks are living documents — this keeps them honest when things change. All of them live in **one GitHub issue**.

**The issue is the only store — never write the revision to a file.** Every artifact you revise (spec, plan, tasks) lives in the GitHub issue, not in the repo. Do **not** create or write it to a Markdown file (no `spec.md`, `plan.md`, `tasks.md`, `specs/` folder, `<slug>.md`, …). Aside from the one-line `.claude/sdd/phase` gate marker, the only content this command writes to disk is a **transient** body file under `.claude/sdd/` — used solely to pipe the updated issue body into `gh`, then deleted — and it is never a `.md`. (A gate hook enforces this: while the marker is set, `.md` writes outside `CLAUDE.md`/`AGENTS.md`/`.claude/rules/**` are denied.)

**Preconditions:** `gh` installed + authenticated, GitHub remote present. If not, say so and stop.

1. **Find the feature.** Resolve the slug (from `$ARGUMENTS`, else the current branch) and locate the spec issue (`gh issue list --label sdd --state all --limit 500 --json number,title,body,state,labels,url` → title starts with `[SDD] <slug>:`). Read its full body — the user story, the `## Technical Plan` section, and the `## Tasks` section. If no spec issue exists, stop and point to `/spec`.
2. **Gate marker:** write `.claude/sdd/phase` with the line `revise:<slug>` and leave it in place (revisions only touch spec artifacts, never code).
3. Apply the requested change to the correct section, preserving the others and all marker pairs:
   - **spec (user story)** → present the revised body sections for review, then after I approve edit the issue body (`gh issue edit <n> --body-file .claude/sdd/issue-body.txt`, then delete the temp file).
   - **plan** → replace the content between `<!-- sdd:plan:start -->` / `<!-- sdd:plan:end -->` (keep the markers).
   - **tasks** → replace the content between `<!-- sdd:tasks:start -->` / `<!-- sdd:tasks:end -->` (keep the markers). Add, reorder, or reword `- [ ]` lines as requested, but preserve the checked state (`- [x]`) of any task you aren't asked to change — don't silently uncheck completed work.
   Present the revision for review, then push the updated body (`gh issue edit <n> --body-file .claude/sdd/issue-body.txt`, then delete the temp file) only after I approve.
4. **Flag downstream staleness.** Because the artifacts depend on each other (spec → plan → tasks), state clearly which downstream artifacts are now potentially out of date and should be regenerated:
   - spec changed → plan and tasks may be stale (`/techplan`, then `/breakdown`)
   - plan changed → tasks may be stale (`/breakdown`)
   Do **not** silently regenerate them — recommend the step and let me decide.
5. **Reopen the lifecycle if needed.** If the spec was `sdd:done` (issue closed) or `sdd:in-progress` and this revision reopens real work — i.e. plan/tasks must be regenerated — reopen the issue (`gh issue reopen <n>`) and move the status label back to `sdd:planned`: `gh issue edit <n> --add-label sdd:planned` and `--remove-label` whichever of `sdd:done`/`sdd:in-progress` is actually present (from the labels you read in step 1), so the feature no longer looks shipped. If it's only a wording/clarity tweak that leaves the shipped behavior intact, leave the status and open/closed state as-is.

Do **not** write feature code. Present the revision and the staleness flags for review (gate).
