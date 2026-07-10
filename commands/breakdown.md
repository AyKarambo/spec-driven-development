---
description: Break the plan into small, testable tasks — added as a checklist in the spec issue
argument-hint: [feature slug/name — matching the spec issue]
disable-model-invocation: true
---

You break the feature **$ARGUMENTS** into small, individually implementable and testable **tasks**, added as a checklist **inside the spec issue** so GitHub's native task-list checkboxes track progress.

**Preconditions (verify first, stop with guidance if missing):** `gh` installed + authenticated, and a GitHub remote exists. If not, stop and explain.

1. **Find the spec issue.** Resolve the slug (from `$ARGUMENTS`, else the current branch). Locate it (`gh issue list --label sdd --state all --limit 500 --json number,title,body,url` → title starts with `[SDD] <slug>:`) and read its body — the user story, the `## Technical Plan` section if present, and the `## Tasks` section (between the `<!-- sdd:tasks:start -->` / `<!-- sdd:tasks:end -->` markers). **If no spec issue exists, stop** and point to `/spec`. (A plan section is recommended but optional — a small feature can be broken down straight from the spec.) **If the `## Tasks` section is already non-empty, stop** and point to `/revise` rather than duplicating them.
2. **Gate marker:** write `.claude/sdd/phase` with the line `tasks:<slug>` and leave it in place.
3. Draft the task list (in the conversation — don't touch the issue yet). Use GitHub's native task-list syntax so each checkbox is detected and counted in the issue's progress bar:
   - `- [ ] **T<n>: <goal>** (<S/M/L>)` — one line per task, the checkbox first
   - indented sub-lines for **Files** (what will likely be touched) and **Check** (how you tell the task is done)
4. Rules: each task **small and individually reviewable**, sensibly ordered (dependencies first), no task bigger than necessary.
5. **Consistency gate (analyze):** before finishing, verify that **every acceptance criterion in the spec issue** maps to at least one task. List any acceptance criteria with no task (gaps) and any tasks that trace to no criterion (scope creep). Make the list complete, or flag what needs a spec/plan revision (`/revise`).
6. Present the task list **and** the consistency check for review (**gate**) — do **not** write code and do **not** touch the issue yet. **Only after I approve:**
   - Read the current body (`gh issue view <n> --json body -q .body`), replace the content **between** the `<!-- sdd:tasks:start -->` and `<!-- sdd:tasks:end -->` markers with a `## Tasks` heading followed by the checklist (leave the markers, and the separate `<!-- sdd:plan:start/end -->` pair, untouched), write the new body to a temp file, and `gh issue edit <n> --body-file <that file>`.
   - **Ensure the lifecycle label is `sdd:planned`:** `gh issue edit <n> --add-label sdd:planned`, and remove `sdd:draft` if it's currently present (tasks exist but none are done yet). `/implement` moves it onward.
   - Report the issue number/URL and the task count.

Note: `/breakdown` is its own command — don't confuse it with the native `/tasks` (= running background jobs).
