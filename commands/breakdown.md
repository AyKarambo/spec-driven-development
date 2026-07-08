---
description: Break the plan into small, testable task sub-issues — and check spec↔plan↔tasks consistency
argument-hint: [feature slug/name — matching the spec issue]
disable-model-invocation: true
---

You break the feature **$ARGUMENTS** into small, individually implementable and testable **tasks**, each opened as a **GitHub sub-issue** of the spec issue.

**Preconditions (verify first, stop with guidance if missing):** `gh` installed + authenticated, and a GitHub remote exists. If not, stop and explain.

1. **Find the spec issue.** Resolve the slug (from `$ARGUMENTS`, else the current branch). Locate it (`gh issue list --label sdd --state all --limit 500 --json number,title,body,url` → title starts with `[SDD] <slug>:`) and read its body — both the user story **and** the `## Technical Plan` section if present. **If no spec issue exists, stop** and point to `/spec`. (A plan section is recommended but optional — a small feature can be broken down straight from the spec.) Check existing sub-issues (`gh issue view <n> --json subIssues`); **if tasks already exist, stop** and point to `/revise` rather than duplicating them.
2. **Gate marker:** write `.claude/sdd/phase` with the line `tasks:<slug>` and leave it in place.
3. Draft a **task list**. Per task:
   - **Goal** – one sentence on what is achieved
   - **Files** – what will likely be touched
   - **Check** – how you can tell the task is done (test/behavior)
   - **Size** – rough (S/M/L)
4. Rules: each task **small and individually reviewable**, sensibly ordered (dependencies first), no task bigger than necessary.
5. **Consistency gate (analyze):** before finishing, verify that **every acceptance criterion in the spec issue** maps to at least one task. List any acceptance criteria with no task (gaps) and any tasks that trace to no criterion (scope creep). Make the list complete, or flag what needs a spec/plan revision (`/revise`).
6. Present the task list **and** the consistency check for review (**gate**) — do **not** write code and do **not** create issues yet. **Only after I approve:**
   - **Create one sub-issue per task**, in order: for each, write its body (the Goal/Files/Check/Size block) to a temp file and run `gh issue create --title "[<slug>] <task title>" --body-file <that file> --label sdd:task --parent <spec#>`. (`--parent` makes it a real GitHub sub-issue, so progress rolls up automatically.)
   - **Ensure the lifecycle label is `sdd:planned`:** `gh issue edit <spec#> --add-label sdd:planned`, and remove `sdd:draft` if it's currently present (tasks exist but none are done yet). `/implement` moves it onward.
   - Report the created task issue numbers.

Note: `/breakdown` is its own command — don't confuse it with the native `/tasks` (= running background jobs).
